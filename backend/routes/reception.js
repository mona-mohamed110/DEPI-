
const express = require("express");
const mongoose = require("mongoose");

const User = require("../models/User");
const { specialtyView } = require("../data/catalog");
const Booking = require("../models/Booking");
const Prescription = require("../models/Prescription");
const AccessGrant = require("../models/AccessGrant");
const { getSchedule, withinHours } = require("../utils/schedule");
const { requireAuth, requireRole } = require("../middleware/auth");
const sendEmail = require("../utils/sendEmail");

const router = express.Router();

router.use(requireAuth, requireRole("reception"));

// موظف الاستقبال تابع لطبيب واحد فقط (الذي أضاف حسابه) ويدير حجوزاته هو فقط
router.use(function (req, res, next) {
  if (!req.user.doctorId) {
    return res.status(403).json({ code: "forbidden" });
  }
  req.doctorId = req.user.doctorId;
  next();
});

// معرّفات مرضى هذا الطبيب: من لهم حجز عنده + من أضافهم الاستقبال
async function clinicPatientFilter(doctorId) {
  const ids = await Booking.distinct("patientId", {
    providerId: doctorId,
    kind: "doctor",
  });
  return {
    role: "patient",
    $or: [{ _id: { $in: ids } }, { createdByDoctor: doctorId }],
  };
}

const QUEUE_STATUSES = [
  "not-arrived",
  "arrived",
  "in-exam",
  "ended",
];

// تاريخ اليوم حسب توقيت مصر
function getToday() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Africa/Cairo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

// تحويل أرقام الهاتف العربية إلى إنجليزية
function normalizePhone(value) {
  return String(value || "")
    .replace(/[٠-٩]/g, (d) => "٠١٢٣٤٥٦٧٨٩".indexOf(d))
    .replace(/\s|-/g, "");
}

function normalizeEgyptPhone(value) {
  let phone = normalizePhone(value);

  if (phone.startsWith("+20")) {
    phone = "0" + phone.slice(3);
  } else if (phone.startsWith("0020")) {
    phone = "0" + phone.slice(4);
  } else if (phone.startsWith("20")) {
    phone = "0" + phone.slice(2);
  }

  return phone;
}

function isValidEgyptPhone(phone) {
  return /^01[0125]\d{8}$/.test(phone);
}

// ===== نوع الزيارة (كشف جديد / إعادة / استشارة) =====
const DEFAULT_FOLLOWUP_DAYS = 14;

function cairoDay(d) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Africa/Cairo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(d));
}

function dayDiff(from, to) {
  const a = from.split("-").map(Number);
  const b = to.split("-").map(Number);
  return Math.round((Date.UTC(b[0], b[1] - 1, b[2]) - Date.UTC(a[0], a[1] - 1, a[2])) / 86400000);
}

async function followUpWindow(doctorId) {
  const doc = await User.findById(doctorId).select("followUpDays");
  return Number.isFinite(doc && doc.followUpDays) ? doc.followUpDays : DEFAULT_FOLLOWUP_DAYS;
}

// يحسب النوع من آخر روشتة كتبها هذا الطبيب لهذا المريض قبل يوم الموعد:
// لا توجد روشتة، أو فات الوقت المسموح  => كشف جديد. غير ذلك => إعادة كشف.
async function visitInfo(doctorId, patientId, date, defaultDays) {
  const fallback = defaultDays || (await followUpWindow(doctorId));
  const rxs = await Prescription.find({ patientId, doctorId })
    .sort({ date: -1 })
    .limit(30)
    .select("date followUpDays graceDays");

  // آخر روشتة قبل يوم الموعد
  const last = rxs.find((x) => cairoDay(x.date) < date) || null;

  if (!last) {
    return { type: "new", lastDate: null, daysSince: null, windowDays: fallback, graceDays: 0, inGrace: false };
  }

  // المدة وفترة السماح يحددهما الطبيب عند كتابة الروشتة
  const windowDays = last.followUpDays || fallback;
  const graceDays = last.graceDays || 0;
  const lastDate = cairoDay(last.date);
  const daysSince = dayDiff(lastDate, date);

  return {
    type: daysSince <= windowDays + graceDays ? "followup" : "new",
    lastDate,
    daysSince,
    windowDays,
    graceDays,
    inGrace: daysSince > windowDays && daysSince <= windowDays + graceDays,
  };
}

async function addVisit(doctorId, bookings, rows) {
  const days = await followUpWindow(doctorId);
  return Promise.all(
    rows.map(async (row, i) => {
      const b = bookings[i];
      if (b.visitType) return { ...row, visitType: b.visitType };
      const pid = (b.patientId && b.patientId._id) || b.patientId;
      const info = await visitInfo(doctorId, pid, b.date, days);
      return { ...row, visitType: info.type, daysSince: info.daysSince };
    })
  );
}

function patientRow(user) {
  return {
    id: String(user._id),
    name: user.name,
    phone: user.phone || "",
  };
}

function requestRow(booking) {
  return {
    id: String(booking._id),
    name: booking.patientId?.name || "",
    doctor: booking.providerId?.name || "",
    date: booking.date,
    time: booking.time,
  };
}

function queueRow(booking) {
  return {
    id: String(booking._id),
    name: booking.patientId?.name || "",
    doctor: booking.providerId?.name || "",
    date: booking.date,
    time: booking.time,
    status: booking.status === "done"
      ? "ended"
      : booking.queue || "not-arrived",
  };
}

function recordRow(booking) {
  return {
    id: String(booking._id),
    name: booking.patientId?.name || "",
    phone: booking.patientId?.phone || "",
    doctor: booking.providerId?.name || "",
    time: booking.time,
    date: booking.date,
  };
}

// ========================================
// الأطباء المتاحون للحجز
// GET /api/reception/doctors
// ========================================
router.get("/doctors", async function (req, res) {
  try {
    const doctors = await User.find({
      _id: req.doctorId,
      role: "doctor",
      status: "active",
    })
      .select("name specialty extra schedule role")
      .sort({ name: 1 });

    res.json(
      doctors.map((doctor) => ({
        id: String(doctor._id),
        name: doctor.name,
        specialty: specialtyView(doctor.specialty || doctor.extra),
        schedule: getSchedule(doctor),
      }))
    );
  } catch (error) {
    console.error("Reception doctors error:", error);
    res.status(500).json({ code: "server_error" });
  }
});

// ========================================
// المرضى
// GET /api/reception/patients
// ========================================
router.get("/patients", async function (req, res) {
  try {
    const patients = await User.find(await clinicPatientFilter(req.doctorId))
      .select("name phone")
      .sort({ name: 1 });

    res.json(patients.map(patientRow));
  } catch (error) {
    console.error("Reception patients error:", error);
    res.status(500).json({ code: "server_error" });
  }
});

// ========================================
// إضافة مريض بدون حساب دخول
// POST /api/reception/patients
// ========================================
router.post("/patients", async function (req, res) {
  try {
    const name = String(req.body.name || "").trim();
    const phone = normalizeEgyptPhone(req.body.phone);
    const rawPhone = String(req.body.phone || "").replace(/[\s-]/g, "");

    // رقم الموبايل ١١ رقمًا بالضبط
    if (name.length < 3 || name.length > 80 || !/^\d{11}$/.test(rawPhone) || !isValidEgyptPhone(phone)) {
      return res.status(400).json({ code: "invalid_data" });
    }

    // منع تكرار نفس رقم الهاتف بين ملفات المرضى
    const existingPatient = await User.findOne({
      role: "patient",
      phone,
    });

    if (existingPatient) {
      return res.status(409).json({ code: "phone_exists" });
    }

    const patient = await User.create({
      name,
      phone,
      role: "patient",
      status: "active",
      password: "",
      createdByDoctor: req.doctorId,
    });

    res.status(201).json(patientRow(patient));
  } catch (error) {
    console.error("Reception add patient error:", error);
    res.status(500).json({ code: "server_error" });
  }
});

// ========================================
// طلبات الحجز المعلقة
// GET /api/reception/requests
// ========================================
router.get("/requests", async function (req, res) {
  try {
    const requests = await Booking.find({
      status: "pending",
      kind: "doctor",
      providerId: req.doctorId,
      cancelRequested: { $ne: true },
    })
      .populate("patientId", "name phone")
      .populate("providerId", "name")
      .sort({ createdAt: -1 });

    res.json(await addVisit(req.doctorId, requests, requests.map(requestRow)));
  } catch (error) {
    console.error("Reception requests error:", error);
    res.status(500).json({ code: "server_error" });
  }
});

// ========================================
// قبول طلب حجز
// POST /api/reception/requests/:id/accept
// ========================================
router.post("/requests/:id/accept", async function (req, res) {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ code: "invalid_id" });
    }

    const booking = await Booking.findOne({
      _id: req.params.id,
      status: "pending",
      kind: "doctor",
      providerId: req.doctorId,
      cancelRequested: { $ne: true },
    });

    if (!booking) {
      return res.status(404).json({ code: "not_found" });
    }

    booking.status = "confirmed";
    booking.queue = "not-arrived";
    await booking.save();

    // منح الدكتور صلاحية الوصول لملف المريض
    if (booking.kind === "doctor") {
      await AccessGrant.findOneAndUpdate(
        {
          patientId: booking.patientId,
          doctorId: booking.providerId,
        },
        {
          $set: {
            bookingId: booking._id,
            status: "active",
            grantedAt: new Date(),
            revokedAt: null,
          },
        },
        { upsert: true, new: true }
      );
    }

    const populated = await Booking.findById(booking._id)
      .populate("patientId", "name phone")
      .populate("providerId", "name");

    res.json((await addVisit(req.doctorId, [populated], [requestRow(populated)]))[0]);
  } catch (error) {
    console.error("Reception accept request error:", error);
    res.status(500).json({ code: "server_error" });
  }
});

// ========================================
// رفض طلب حجز
// POST /api/reception/requests/:id/reject
// ========================================
router.post("/requests/:id/reject", async function (req, res) {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ code: "invalid_id" });
    }

    const booking = await Booking.findOneAndUpdate(
      {
        _id: req.params.id,
        status: "pending",
        kind: "doctor",
        providerId: req.doctorId,
      },
      {
        $set: {
          status: "rejected",
          rejectReason: String((req.body && req.body.reason) || "").replace(/\s+/g, " ").trim().slice(0, 200),
          rejectedAt: new Date(),
          rejectSeen: false,
        },
      },
      { new: true }
    );

    if (!booking) {
      return res.status(404).json({ code: "not_found" });
    }

    // إبلاغ المريض بالبريد (لا يوقف الرفض عند الفشل)
    try {
      const [patient, doctor] = await Promise.all([
        User.findById(booking.patientId).select("email name"),
        User.findById(booking.providerId).select("name"),
      ]);
      if (patient && patient.email) {
        const text =
          "مرحباً " + patient.name + "،\n\n" +
          "نأسف، لم يتم قبول طلب حجزك عند " + (doctor ? doctor.name : "الطبيب") +
          " بتاريخ " + booking.date + " الساعة " + booking.time + "." +
          (booking.rejectReason ? "\nالسبب: " + booking.rejectReason : "") +
          "\n\nيمكنك حجز موعد آخر من حسابك على المنصة.";
        await sendEmail(patient.email, "Shefaa - تم رفض طلب الحجز", text);
      }
    } catch (mailError) {
      console.error("Reject notify email error:", mailError.message || mailError);
    }

    res.json({ ok: true, id: String(booking._id) });
  } catch (error) {
    console.error("Reception reject request error:", error);
    res.status(500).json({ code: "server_error" });
  }
});

// ========================================
// طلبات إلغاء الحجز من المرضى
// ========================================
router.get("/cancel-requests", async function (req, res) {
  try {
    const list = await Booking.find({
      kind: "doctor",
      providerId: req.doctorId,
      status: { $in: ["pending", "confirmed"] },
      cancelRequested: true,
    })
      .populate("patientId", "name phone")
      .populate("providerId", "name")
      .sort({ cancelRequestedAt: 1 });
    res.json(list.map((b) => ({ ...requestRow(b), status: b.status })));
  } catch (error) {
    console.error("Reception cancel requests error:", error);
    res.status(500).json({ code: "server_error" });
  }
});

router.post("/cancel-requests/:id/:decision", async function (req, res) {
  try {
    const { id, decision } = req.params;
    if (!mongoose.isValidObjectId(id) || !["approve", "decline"].includes(decision)) {
      return res.status(400).json({ code: "invalid_data" });
    }
    const booking = await Booking.findOne({
      _id: id,
      kind: "doctor",
      providerId: req.doctorId,
      status: { $in: ["pending", "confirmed"] },
      cancelRequested: true,
    });
    if (!booking) return res.status(404).json({ code: "not_found" });

    if (decision === "approve") {
      booking.status = "cancelled";
      booking.cancelRequested = false;
    } else {
      booking.cancelRequested = false;
      booking.cancelDeclined = true;
    }
    await booking.save();

    // إبلاغ المريض بالبريد (لا يوقف القرار عند الفشل)
    try {
      const [patient, doctor] = await Promise.all([
        User.findById(booking.patientId).select("email name"),
        User.findById(booking.providerId).select("name"),
      ]);
      if (patient && patient.email) {
        const where = (doctor ? doctor.name : "الطبيب") + " بتاريخ " + booking.date + " الساعة " + booking.time;
        const text = decision === "approve"
          ? "مرحباً " + patient.name + "،\n\nتمت الموافقة على إلغاء حجزك عند " + where + ".\n\nيمكنك حجز موعد جديد من حسابك على المنصة."
          : "مرحباً " + patient.name + "،\n\nلم تتم الموافقة على إلغاء حجزك عند " + where + ". الحجز ما زال قائماً.";
        await sendEmail(patient.email, decision === "approve" ? "Shefaa - تم إلغاء الحجز" : "Shefaa - لم يتم إلغاء الحجز", text);
      }
    } catch (mailError) {
      console.error("Cancel decision email error:", mailError.message || mailError);
    }

    res.json({ ok: true, id: String(booking._id) });
  } catch (error) {
    console.error("Reception cancel decision error:", error);
    res.status(500).json({ code: "server_error" });
  }
});

// ========================================
// طلبات تعديل موعد من المرضى (بعد قبول الحجز)
// ========================================
router.get("/edit-requests", async function (req, res) {
  try {
    const list = await Booking.find({
      kind: "doctor",
      providerId: req.doctorId,
      status: "confirmed",
      cancelRequested: { $ne: true },
      editReqDate: { $ne: "" },
    })
      .populate("patientId", "name phone")
      .populate("providerId", "name")
      .sort({ editReqAt: 1 });
    res.json(list.map((b) => ({ ...requestRow(b), newDate: b.editReqDate, newTime: b.editReqTime })));
  } catch (error) {
    console.error("Reception edit requests error:", error);
    res.status(500).json({ code: "server_error" });
  }
});

router.post("/edit-requests/:id/:decision", async function (req, res) {
  try {
    const { id, decision } = req.params;
    if (!mongoose.isValidObjectId(id) || !["approve", "decline"].includes(decision)) {
      return res.status(400).json({ code: "invalid_data" });
    }
    const booking = await Booking.findOne({
      _id: id,
      kind: "doctor",
      providerId: req.doctorId,
      status: "confirmed",
      editReqDate: { $ne: "" },
    });
    if (!booking) return res.status(404).json({ code: "not_found" });

    const oldDate = booking.date;
    const oldTime = booking.time;

    if (decision === "approve") {
      const provider = await User.findById(booking.providerId).select("role schedule labProfile");
      if (provider && !withinHours(provider, booking.editReqDate, booking.editReqTime)) {
        return res.status(400).json({ code: "outside_hours" });
      }
      const conflict = await Booking.findOne({
        _id: { $ne: booking._id },
        providerId: booking.providerId,
        date: booking.editReqDate,
        time: booking.editReqTime,
        status: { $in: ["pending", "confirmed"] },
      });
      if (conflict) return res.status(409).json({ code: "slot_unavailable" });
      booking.date = booking.editReqDate;
      booking.time = booking.editReqTime;
      booking.queue = "not-arrived";
      booking.visitType = null;
    } else {
      booking.editDeclined = true;
    }
    const newDate = booking.editReqDate;
    const newTime = booking.editReqTime;
    booking.editReqDate = "";
    booking.editReqTime = "";
    booking.editReqAt = null;
    await booking.save();

    // إبلاغ المريض بالبريد (لا يوقف القرار عند الفشل)
    try {
      const [patient, doctor] = await Promise.all([
        User.findById(booking.patientId).select("email name"),
        User.findById(booking.providerId).select("name"),
      ]);
      if (patient && patient.email) {
        const who = doctor ? doctor.name : "الطبيب";
        const text = decision === "approve"
          ? "مرحباً " + patient.name + "،\n\nتمت الموافقة على تعديل موعدك عند " + who + ". الموعد الجديد: " + newDate + " الساعة " + newTime + "."
          : "مرحباً " + patient.name + "،\n\nلم تتم الموافقة على تعديل موعدك عند " + who + ". موعدك الحالي ما زال: " + oldDate + " الساعة " + oldTime + ".";
        await sendEmail(patient.email, decision === "approve" ? "Shefaa - تم تعديل الموعد" : "Shefaa - لم يتم تعديل الموعد", text);
      }
    } catch (mailError) {
      console.error("Edit decision email error:", mailError.message || mailError);
    }

    res.json({ ok: true, id: String(booking._id) });
  } catch (error) {
    console.error("Reception edit decision error:", error);
    res.status(500).json({ code: "server_error" });
  }
});

// ========================================
// طابور اليوم
// GET /api/reception/queue
// ========================================
router.get("/queue", async function (req, res) {
  try {
    const bookings = await Booking.find({
      date: getToday(),
      status: { $in: ["confirmed", "done"] },
      kind: "doctor",
      providerId: req.doctorId,
    })
      .populate("patientId", "name phone")
      .populate("providerId", "name")
      .sort({ time: 1 });

    res.json(await addVisit(req.doctorId, bookings, bookings.map(queueRow)));
  } catch (error) {
    console.error("Reception queue error:", error);
    res.status(500).json({ code: "server_error" });
  }
});

// ========================================
// تحديث حالة المريض في الطابور
// PATCH /api/reception/queue/:id
// ========================================
router.patch("/queue/:id", async function (req, res) {
  try {
    const { status } = req.body;

    if (
      !mongoose.isValidObjectId(req.params.id) ||
      !QUEUE_STATUSES.includes(status)
    ) {
      return res.status(400).json({ code: "invalid_data" });
    }

    const booking = await Booking.findOne({
      _id: req.params.id,
      kind: "doctor",
      providerId: req.doctorId,
      status: { $in: ["confirmed", "done"] },
    });

    if (!booking) {
      return res.status(404).json({ code: "not_found" });
    }

    booking.queue = status;
    await booking.save();

    const populated = await Booking.findById(booking._id)
      .populate("patientId", "name phone")
      .populate("providerId", "name");

    res.json(queueRow(populated));
  } catch (error) {
    console.error("Reception update queue error:", error);
    res.status(500).json({ code: "server_error" });
  }
});

// ========================================
// نوع الزيارة المتوقع لمريض في يوم معين
// GET /api/reception/visit-type?patientId=&date=
// ========================================
router.get("/visit-type", async function (req, res) {
  try {
    const patientId = req.query.patientId;
    let date = String(req.query.date || "").trim();
    if (date === "today") date = getToday();

    if (!mongoose.isValidObjectId(patientId) || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return res.status(400).json({ code: "invalid_data" });
    }

    const patient = await User.findOne({
      $and: [{ _id: patientId, status: "active" }, await clinicPatientFilter(req.doctorId)],
    });
    if (!patient) return res.status(404).json({ code: "patient_not_found" });

    res.json(await visitInfo(req.doctorId, patientId, date));
  } catch (error) {
    console.error("Reception visit type error:", error);
    res.status(500).json({ code: "server_error" });
  }
});

// ========================================
// حجز موعد من الاستقبال
// POST /api/reception/appointments
// ========================================
router.post("/appointments", async function (req, res) {
  try {
    const patientId = req.body.patientId;
    const providerId = String(req.doctorId);
    if (req.body.providerId && String(req.body.providerId) !== providerId) {
      return res.status(403).json({ code: "forbidden" });
    }
    const time = String(req.body.time || "").trim();

    let date = String(req.body.date || req.body.day || "").trim();

    if (date === "today") {
      date = getToday();
    }

    if (
      !mongoose.isValidObjectId(patientId) ||
      !mongoose.isValidObjectId(providerId) ||
      !/^\d{4}-\d{2}-\d{2}$/.test(date) ||
      !/^\d{2}:\d{2}$/.test(time)
    ) {
      return res.status(400).json({ code: "invalid_data" });
    }

    const patient = await User.findOne({
      $and: [
        { _id: patientId, status: "active" },
        await clinicPatientFilter(req.doctorId),
      ],
    });

    if (!patient) {
      return res.status(404).json({ code: "patient_not_found" });
    }

    const doctor = await User.findOne({
      _id: providerId,
      role: "doctor",
      status: "active",
    });

    if (!doctor) {
      return res.status(404).json({ code: "doctor_not_found" });
    }

    if (!withinHours(doctor, date, time)) {
      return res.status(400).json({ code: "outside_hours" });
    }

    const conflict = await Booking.findOne({
      providerId,
      date,
      time,
      status: { $in: ["pending", "confirmed"] },
    });

    if (conflict) {
      return res.status(409).json({ code: "slot_taken" });
    }

    // النوع يحسبه الخادم من آخر روشتة؛ الاستقبال يستطيع فقط تحويله إلى "استشارة" إذا كانت للمريض روشتة سابقة
    const info = await visitInfo(providerId, patientId, date);
    const visitType = req.body.visit === "consult" && info.lastDate ? "consult" : info.type;

    const booking = await Booking.create({
      patientId,
      providerId,
      kind: "doctor",
      date,
      time,
      status: "confirmed",
      queue: "not-arrived",
      source: "reception",
      visitType,
    });

    await AccessGrant.findOneAndUpdate(
      { patientId, doctorId: providerId },
      {
        $set: {
          bookingId: booking._id,
          status: "active",
          grantedAt: new Date(),
          revokedAt: null,
        },
      },
      { upsert: true, new: true }
    );

    const populated = await Booking.findById(booking._id)
      .populate("patientId", "name phone")
      .populate("providerId", "name");

    res.status(201).json({ ...recordRow(populated), visitType });
  } catch (error) {
    console.error("Reception book appointment error:", error);
    res.status(500).json({ code: "server_error" });
  }
});

// ========================================
// سجلات الحجوزات
// GET /api/reception/records
// ========================================
router.get("/records", async function (req, res) {
  try {
    const bookings = await Booking.find({
      kind: "doctor",
      providerId: req.doctorId,
      status: { $in: ["confirmed", "done"] },
    })
      .populate("patientId", "name phone")
      .populate("providerId", "name")
      .sort({ date: -1, time: -1 });

    res.json(bookings.map(recordRow));
  } catch (error) {
    console.error("Reception records error:", error);
    res.status(500).json({ code: "server_error" });
  }
});

// ========================================
// حذف سجل حجز فقط، وليس حساب المريض
// DELETE /api/reception/records/:id
// ========================================
router.delete("/records/:id", async function (req, res) {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ code: "invalid_id" });
    }

    const booking = await Booking.findOneAndDelete({
      _id: req.params.id,
      kind: "doctor",
      providerId: req.doctorId,
    });

    if (!booking) {
      return res.status(404).json({ code: "not_found" });
    }

    await AccessGrant.updateOne(
      {
        patientId: booking.patientId,
        doctorId: booking.providerId,
        bookingId: booking._id,
      },
      { $set: { bookingId: null } }
    );

    res.json({ ok: true });
  } catch (error) {
    console.error("Reception delete record error:", error);
    res.status(500).json({ code: "server_error" });
  }
});

module.exports = router;
