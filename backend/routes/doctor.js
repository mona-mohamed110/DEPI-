
const express = require("express");
const mongoose = require("mongoose");
const fs = require("fs");
const path = require("path");
const bcrypt = require("bcrypt");
const Booking = require("../models/Booking");
const User = require("../models/User");
const AccessGrant = require("../models/AccessGrant");
const MedicalRecord = require("../models/MedicalRecord");
const Prescription = require("../models/Prescription");
const LabResult = require("../models/LabResult");
const DoctorTest = require("../models/DoctorTest");

const { logAccess } = require("../utils/accessLog");
const { specialtyView, CHRONIC } = require("../data/catalog");
const { requireAuth, requireRole } = require("../middleware/auth");
const { uploadCertificate, uploadMultiple } = require("../middleware/upload");

const router = express.Router();

router.use(requireAuth, requireRole("doctor"));

// Calculate patient age
function getAge(birthDate) {
  if (!birthDate) return null;

  const birth = new Date(birthDate);
  if (Number.isNaN(birth.getTime())) return null;

  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();

  if (
    today.getMonth() < birth.getMonth() ||
    (today.getMonth() === birth.getMonth() &&
      today.getDate() < birth.getDate())
  ) {
    age--;
  }

  return age;
}

// Check active patient permission
async function getActiveGrant(patientId, doctorId) {
  return AccessGrant.findOne({
    patientId,
    doctorId,
    status: "active",
    $or: [{ until: null }, { until: { $gt: new Date() } }],
  });
}

// ===============================
// Dashboard
// ===============================

router.get("/dashboard", async (req, res) => {
  try {
    const now = new Date();

    const formatter = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Africa/Cairo",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });

    const today = formatter.format(now);

    const isValidDate = (value) => {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(value || "")) return false;

      const date = new Date(`${value}T00:00:00Z`);

      return (
        !Number.isNaN(date.getTime()) &&
        date.toISOString().slice(0, 10) === value
      );
    };

    const isValidMonth = (value) =>
      /^\d{4}-(0[1-9]|1[0-2])$/.test(value || "");

    const selectedDate = isValidDate(req.query.date)
      ? req.query.date
      : today;

    const month = isValidMonth(req.query.month)
      ? req.query.month
      : selectedDate.slice(0, 7);

    const monthStart = `${month}-01`;
    const nextMonth = new Date(`${monthStart}T00:00:00Z`);

    nextMonth.setUTCMonth(nextMonth.getUTCMonth() + 1);

    const monthEnd = new Date(nextMonth.getTime() - 86400000)
      .toISOString()
      .slice(0, 10);

    const baseFilter = {
      providerId: req.user._id,
      kind: "doctor",
      status: { $nin: ["cancelled", "rejected"] },
    };

    const allBookings = await Booking.find(baseFilter)
      .populate("patientId", "name")
      .lean();

    const getDisplayDate = (item) => {
      if (item.status === "done" && item.examinedAt) {
        return new Intl.DateTimeFormat("en-CA", {
          timeZone: "Africa/Cairo",
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
        }).format(new Date(item.examinedAt));
      }

      return item.date;
    };

    // خيار الطبيب: عرض اليوم الحالي للي عليه الدور فقط (موظف الاستقبال أدخله الكشف ولسه مخلصش)
    const queueOnly = !!req.user.queueOnly;
    const appointments = allBookings
      .filter((item) => getDisplayDate(item) === selectedDate)
      .filter((item) => !(queueOnly && selectedDate === today) || (item.queue === "in-exam" && item.status !== "done"))
      .sort((a, b) => {
        const timeA =
          a.status === "done" && a.examinedAt
            ? new Date(a.examinedAt).getTime()
            : new Date(`1970-01-01T${a.time}`).getTime();

        const timeB =
          b.status === "done" && b.examinedAt
            ? new Date(b.examinedAt).getTime()
            : new Date(`1970-01-01T${b.time}`).getTime();

        return timeA - timeB;
      });

    const todayAppointments = allBookings.filter(
      (item) => getDisplayDate(item) === today
    );

    const calendarDates = [
      ...new Set(
        allBookings
          .map(getDisplayDate)
          .filter((date) => date >= monthStart && date <= monthEnd)
      ),
    ];

    const [patientsCount, prescriptionsCount] = await Promise.all([
      AccessGrant.countDocuments({
        doctorId: req.user._id,
        status: "active",
      }),

      Prescription.countDocuments({
        doctorId: req.user._id,
      }),
    ]);

    const waiting = todayAppointments.filter(
      (item) => item.status === "pending"
    ).length;

    return res.json({
      stats: {
        today: todayAppointments.length,
        waiting,
        patients: patientsCount,
        prescriptions: prescriptionsCount,
      },

      selectedDate,
      queueOnly,
      calendarDates,

      appointments: appointments.map((item) => ({
        id: item._id.toString(),
        patientId: item.patientId?._id?.toString() || "",
        name: item.patientId?.name || "",
        date: getDisplayDate(item),

        time:
          item.status === "done" && item.examinedAt
            ? new Intl.DateTimeFormat("en-GB", {
                timeZone: "Africa/Cairo",
                hour: "2-digit",
                minute: "2-digit",
                hour12: false,
              }).format(new Date(item.examinedAt))
            : item.time,

        status:
          item.status === "done"
            ? "done"
            : item.status === "pending"
              ? "wait"
              : "exam",
      })),
    });
  } catch (error) {
    console.error("Doctor dashboard error:", error);
    return res.status(500).json({ code: "server_error" });
  }
});

// ===============================
// Patients with active permission
// ===============================

router.get("/patients", async (req, res) => {
  try {
    const doctorId = req.user.id || req.user._id;

    const grants = await AccessGrant.find({
      doctorId,
      status: "active",
    })
      .populate("patientId", "name phone profile")
      .sort({ grantedAt: -1 })
      .lean();

    const validGrants = grants.filter((grant) => grant.patientId);

    const patientIds = validGrants.map(
      (grant) => grant.patientId._id
    );

    const bookings = await Booking.find({
      providerId: doctorId,
      kind: "doctor",
      patientId: { $in: patientIds },
      status: { $nin: ["cancelled", "rejected"] },
    })
      .sort({ date: -1, time: -1, createdAt: -1 })
      .select("_id patientId date time status")
      .lean();

    const latestBooking = new Map();

    for (const booking of bookings) {
      const patientId = booking.patientId.toString();

      if (!latestBooking.has(patientId)) {
        latestBooking.set(patientId, booking);
      }
    }

    const activeBookings = await Booking.find({
      providerId: doctorId,
      kind: "doctor",
      patientId: { $in: patientIds },
      status: { $in: ["pending", "confirmed"] },
    })
      .sort({ date: -1, time: -1, createdAt: -1 })
      .select("_id patientId date time status queue")
      .lean();

    // حجز اليوم لكل مريض (بتوقيت القاهرة) — لقائمة «مرضاي»
    const todayStr = new Intl.DateTimeFormat("en-CA", { timeZone: "Africa/Cairo", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
    const todayBookings = await Booking.find({
      providerId: doctorId,
      kind: "doctor",
      patientId: { $in: patientIds },
      date: todayStr,
      status: { $nin: ["cancelled", "rejected"] },
    })
      .sort({ time: 1 })
      .select("_id patientId date time status queue")
      .lean();
    const todayMap = new Map();
    for (const b of todayBookings) {
      const pid = b.patientId.toString();
      if (!todayMap.has(pid)) todayMap.set(pid, b);
    }

    // خيار الطبيب (صفحة الكشف فقط): يظهر المريض اللي موظف الاستقبال أدخله الكشف ولسه مخلصش
    const examQueueOnly = req.query.forExam === "1" && !!req.user.queueOnly;
    const activeBookingMap = new Map();
    const activeListMap = new Map();

    for (const booking of activeBookings) {
      if (examQueueOnly && booking.queue !== "in-exam") continue;
      const patientId = booking.patientId.toString();
      if (!activeListMap.has(patientId)) activeListMap.set(patientId, []);
      activeListMap.get(patientId).push(booking);

      if (!activeBookingMap.has(patientId)) {
        activeBookingMap.set(patientId, booking);
      }
    }

    const patients = validGrants.map((grant) => {
      const patient = grant.patientId;
      const profile = patient.profile || {};

      const lastBooking = latestBooking.get(
        patient._id.toString()
      );

      const activeBooking = activeBookingMap.get(
        patient._id.toString()
      );

      return {
        id: patient._id.toString(),
        name: patient.name || "",
        age: getAge(profile.birthDate),
        chronic: Array.isArray(profile.chronicIds)
          ? profile.chronicIds
          : [],
        until: null,

        lastBooking: lastBooking
          ? {
              id: lastBooking._id.toString(),
              status: lastBooking.status,
              date: lastBooking.date,
              time: lastBooking.time,
            }
          : null,

        todayBooking: todayMap.get(patient._id.toString())
          ? {
              id: todayMap.get(patient._id.toString())._id.toString(),
              status: todayMap.get(patient._id.toString()).status,
              date: todayMap.get(patient._id.toString()).date,
              time: todayMap.get(patient._id.toString()).time,
            }
          : null,

        // كل الحجوزات المفتوحة للمريض في أي يوم (الأقرب أولًا)
        activeBookings: (activeListMap.get(patient._id.toString()) || [])
          .slice()
          .sort((a, b) => String(a.date + (a.time || "")).localeCompare(String(b.date + (b.time || ""))))
          .map((b) => ({ id: b._id.toString(), status: b.status, date: b.date, time: b.time })),

        activeBooking: activeBooking
          ? {
              id: activeBooking._id.toString(),
              status: activeBooking.status,
              date: activeBooking.date,
              time: activeBooking.time,
            }
          : null,
      };
    });

    return res.json(patients);
  } catch (error) {
    console.error("Get doctor patients error:", error);

    return res.status(500).json({
      code: "server_error",
    });
  }
});

// ===============================
// Doctor custom tests
// ===============================

// أسماء تحاليل الطبيب المخصصة (مرتبة بوقت الإضافة)
async function customTestNames(doctorId) {
  const rows = await DoctorTest.find({ doctorId })
    .sort({ createdAt: 1 })
    .select("name -_id")
    .lean();
  return rows.map((row) => row.name);
}

router.get("/tests", async (req, res) => {
  try {
    const tests = await DoctorTest.find({
      doctorId: req.user._id,
    })
      .sort({ createdAt: 1 })
      .select("name -_id")
      .lean();

    return res.json({
      custom: tests.map((test) => test.name),
    });
  } catch (error) {
    console.error("Get doctor tests error:", error);
    return res.status(500).json({ code: "server_error" });
  }
});

// Add custom test
router.post("/tests", async (req, res) => {
  try {
    const name =
      typeof req.body.name === "string" ? req.body.name.trim() : "";

    if (!name || name.length > 100) {
      return res.status(400).json({
        code: "invalid_test_name",
      });
    }

    const escapedName = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

    const existing = await DoctorTest.findOne({
      doctorId: req.user._id,
      name: { $regex: `^${escapedName}$`, $options: "i" },
    });

    if (existing) {
      return res.status(409).json({
        code: "test_already_exists",
      });
    }

    await DoctorTest.create({
      doctorId: req.user._id,
      name,
    });

    // الواجهة تتوقع القائمة الكاملة بعد الإضافة
    return res.status(201).json(await customTestNames(req.user._id));
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        code: "test_already_exists",
      });
    }

    console.error("Add doctor test error:", error);
    return res.status(500).json({ code: "server_error" });
  }
});

// Remove custom test
router.delete("/tests/:name", async (req, res) => {
  try {
    const name = req.params.name.trim();

    if (!name) {
      return res.status(400).json({
        code: "invalid_test_name",
      });
    }

    const escapedName = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

    const deleted = await DoctorTest.findOneAndDelete({
      doctorId: req.user._id,
      name: { $regex: `^${escapedName}$`, $options: "i" },
    });

    if (!deleted) {
      return res.status(404).json({
        code: "test_not_found",
      });
    }

    // الواجهة تتوقع القائمة الكاملة بعد الحذف
    return res.json(await customTestNames(req.user._id));
  } catch (error) {
    console.error("Remove doctor test error:", error);
    return res.status(500).json({ code: "server_error" });
  }
});

// ===============================
// Patient medical file
// ===============================

function cleanOther(v) {
  const arr = Array.isArray(v) ? v : String(v || "").split(/[,،;\n]/);
  return arr.map((x) => String(x).trim().slice(0, 60)).filter(Boolean).slice(0, 10);
}

// المريض اللي أضافه موظف الاستقبال بدون حساب دخول: الطبيب صاحب العيادة فقط هو اللي يكمّل بياناته
function isManagedPatient(patient, doctorId) {
  return !!patient &&
    !patient.password &&
    patient.createdByDoctor &&
    String(patient.createdByDoctor) === String(doctorId);
}

// تعديل البيانات الصحية لمريض بدون حساب (أضافه موظف الاستقبال)
router.put("/patients/:id/profile", async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(404).json({ code: "not_found" });
    }

    const grant = await getActiveGrant(id, req.user._id);
    const patient = await User.findOne({ _id: id, role: "patient" }).select("password createdByDoctor");

    if (!patient) return res.status(404).json({ code: "not_found" });
    if (!grant || !isManagedPatient(patient, req.user._id)) {
      return res.status(403).json({ code: "access_denied" });
    }

    const b = req.body || {};
    const set = {};

    if (b.birthDate !== undefined && b.birthDate !== "") {
      const ok = /^\d{4}-\d{2}-\d{2}$/.test(String(b.birthDate));
      const dt = new Date(b.birthDate);
      if (!ok || Number.isNaN(dt.getTime()) || dt >= new Date() || dt.getFullYear() <= 1900) {
        return res.status(400).json({ code: "invalid_data" });
      }
      set["profile.birthDate"] = b.birthDate;
    }
    if (b.blood !== undefined) set["profile.blood"] = String(b.blood).slice(0, 4);
    if (b.height !== undefined) set["profile.height"] = Math.max(0, Math.min(300, Number(b.height) || 0));
    if (b.weight !== undefined) set["profile.weight"] = Math.max(0, Math.min(500, Number(b.weight) || 0));
    if (Array.isArray(b.chronicIds)) {
      set["profile.chronicIds"] = b.chronicIds.map(String).filter((cid) => CHRONIC.some((c) => c.id === cid));
    }
    if (b.chronicOther !== undefined) set["profile.chronicOther"] = cleanOther(b.chronicOther);

    if (Object.keys(set).length) await User.updateOne({ _id: id }, { $set: set });
    logAccess(id, req.user, "updated_profile");

    return res.json({ ok: true });
  } catch (error) {
    console.error("Doctor update patient profile error:", error);
    return res.status(500).json({ code: "server_error" });
  }
});

// ---- تعديل الملف الطبي لمريض بدون حساب (أضافه موظف الاستقبال) ----
async function managedPatientOr403(req, res) {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    res.status(404).json({ code: "not_found" });
    return null;
  }
  const grant = await getActiveGrant(id, req.user._id);
  const patient = await User.findOne({ _id: id, role: "patient" }).select("password createdByDoctor");
  if (!patient) {
    res.status(404).json({ code: "not_found" });
    return null;
  }
  if (!grant || !isManagedPatient(patient, req.user._id)) {
    res.status(403).json({ code: "access_denied" });
    return null;
  }
  return patient;
}

const UPLOADS_DIR = path.resolve(__dirname, "../uploads");
function removeUpload(rel) {
  try {
    const p = path.resolve(__dirname, "..", rel || "");
    if (rel && p.startsWith(UPLOADS_DIR + path.sep)) fs.unlink(p, () => {});
  } catch (e) { /* ignore */ }
}

function historyBody(b) {
  const condition = String(b.condition || "").trim();
  const date = String(b.date || "").trim();
  const notes = String(b.notes || "").trim();
  if (!condition || condition.length > 200 || notes.length > 1000 || date.length > 20) return null;
  return { condition, date, notes };
}

router.post("/patients/:id/history", async (req, res) => {
  try {
    if (!(await managedPatientOr403(req, res))) return;
    const h = historyBody(req.body || {});
    if (!h) return res.status(400).json({ code: "invalid_data" });
    await MedicalRecord.findOneAndUpdate(
      { patientId: req.params.id },
      { $push: { history: h } },
      { upsert: true, setDefaultsOnInsert: true }
    );
    logAccess(req.params.id, req.user, "updated_profile");
    return res.status(201).json({ ok: true });
  } catch (error) {
    console.error("Doctor add history error:", error);
    return res.status(500).json({ code: "server_error" });
  }
});

router.put("/patients/:id/history/:hid", async (req, res) => {
  try {
    if (!(await managedPatientOr403(req, res))) return;
    const h = historyBody(req.body || {});
    if (!h || !mongoose.Types.ObjectId.isValid(req.params.hid)) return res.status(400).json({ code: "invalid_data" });
    const record = await MedicalRecord.findOne({ patientId: req.params.id });
    const item = record && record.history.id(req.params.hid);
    if (!item) return res.status(404).json({ code: "not_found" });
    Object.assign(item, h);
    await record.save();
    logAccess(req.params.id, req.user, "updated_profile");
    return res.json({ ok: true });
  } catch (error) {
    console.error("Doctor update history error:", error);
    return res.status(500).json({ code: "server_error" });
  }
});

router.delete("/patients/:id/history/:hid", async (req, res) => {
  try {
    if (!(await managedPatientOr403(req, res))) return;
    if (!mongoose.Types.ObjectId.isValid(req.params.hid)) return res.status(404).json({ code: "not_found" });
    const record = await MedicalRecord.findOne({ patientId: req.params.id });
    const item = record && record.history.id(req.params.hid);
    if (!item) return res.status(404).json({ code: "not_found" });
    item.deleteOne();
    await record.save();
    logAccess(req.params.id, req.user, "updated_profile");
    return res.json({ ok: true });
  } catch (error) {
    console.error("Doctor delete history error:", error);
    return res.status(500).json({ code: "server_error" });
  }
});

router.post("/patients/:id/reports", async (req, res, next) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) return res.status(404).json({ code: "not_found" });
  // نتأكد من الصلاحية قبل رفع أي ملف
  if (!(await managedPatientOr403(req, res))) return;
  next();
}, uploadMultiple, async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) return res.status(400).json({ code: "invalid_data" });
    const reports = req.files.map((file) => ({
      name: file.originalname,
      fileName: file.filename,
      filePath: `uploads/${file.filename}`,
      fileType: file.mimetype,
      size: file.size,
      uploadedAt: new Date(),
    }));
    await MedicalRecord.findOneAndUpdate(
      { patientId: req.params.id },
      { $push: { reports: { $each: reports } } },
      { upsert: true, setDefaultsOnInsert: true }
    );
    logAccess(req.params.id, req.user, "updated_profile");
    return res.status(201).json({ ok: true });
  } catch (error) {
    console.error("Doctor upload report error:", error);
    return res.status(500).json({ code: "server_error" });
  }
});

router.delete("/patients/:id/reports/:rid", async (req, res) => {
  try {
    if (!(await managedPatientOr403(req, res))) return;
    if (!mongoose.Types.ObjectId.isValid(req.params.rid)) return res.status(404).json({ code: "not_found" });
    const record = await MedicalRecord.findOne({ patientId: req.params.id });
    const report = record && record.reports.id(req.params.rid);
    if (!report) return res.status(404).json({ code: "not_found" });
    removeUpload(report.filePath);
    report.deleteOne();
    await record.save();
    logAccess(req.params.id, req.user, "updated_profile");
    return res.json({ ok: true });
  } catch (error) {
    console.error("Doctor delete report error:", error);
    return res.status(500).json({ code: "server_error" });
  }
});

const RESULT_KINDS = ["lab", "xray", "ecg", "other"];
const RESULT_STATUS = ["normal", "low", "high", "followup"];

router.post("/patients/:id/results", async (req, res, next) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) return res.status(404).json({ code: "not_found" });
  if (!(await managedPatientOr403(req, res))) return;
  next();
}, uploadMultiple, async (req, res) => {
  try {
    const title = String(req.body.title || "").trim().slice(0, 120);
    if (!title || !req.files || req.files.length === 0) {
      (req.files || []).forEach((f) => removeUpload(`uploads/${f.filename}`));
      return res.status(400).json({ code: "invalid_data" });
    }
    const kind = RESULT_KINDS.includes(req.body.kind) ? req.body.kind : "lab";
    const status = RESULT_STATUS.includes(req.body.status) ? req.body.status : "normal";
    await LabResult.insertMany(req.files.map((file) => ({
      patientId: req.params.id,
      labId: req.user._id,
      byDoctor: true,
      title,
      kind,
      status,
      fileName: file.originalname,
      filePath: `uploads/${file.filename}`,
      fileType: file.mimetype,
    })));
    logAccess(req.params.id, req.user, "updated_profile");
    return res.status(201).json({ ok: true });
  } catch (error) {
    console.error("Doctor add result error:", error);
    return res.status(500).json({ code: "server_error" });
  }
});

router.put("/patients/:id/results/:rid", async (req, res) => {
  try {
    if (!(await managedPatientOr403(req, res))) return;
    if (!mongoose.Types.ObjectId.isValid(req.params.rid)) return res.status(404).json({ code: "not_found" });
    const result = await LabResult.findOne({ _id: req.params.rid, patientId: req.params.id, byDoctor: true });
    if (!result) return res.status(404).json({ code: "not_found" });
    const title = String(req.body.title || "").trim().slice(0, 120);
    if (!title) return res.status(400).json({ code: "invalid_data" });
    result.title = title;
    if (RESULT_KINDS.includes(req.body.kind)) result.kind = req.body.kind;
    if (RESULT_STATUS.includes(req.body.status)) result.status = req.body.status;
    await result.save();
    logAccess(req.params.id, req.user, "updated_profile");
    return res.json({ ok: true });
  } catch (error) {
    console.error("Doctor update result error:", error);
    return res.status(500).json({ code: "server_error" });
  }
});

router.delete("/patients/:id/results/:rid", async (req, res) => {
  try {
    if (!(await managedPatientOr403(req, res))) return;
    if (!mongoose.Types.ObjectId.isValid(req.params.rid)) return res.status(404).json({ code: "not_found" });
    const result = await LabResult.findOneAndDelete({ _id: req.params.rid, patientId: req.params.id, byDoctor: true });
    if (!result) return res.status(404).json({ code: "not_found" });
    removeUpload(result.filePath);
    logAccess(req.params.id, req.user, "updated_profile");
    return res.json({ ok: true });
  } catch (error) {
    console.error("Doctor delete result error:", error);
    return res.status(500).json({ code: "server_error" });
  }
});

// تعديل آخر روشتة كتبها الطبيب للمريض (أي مريض له عليه إذن)
router.put("/patients/:id/prescriptions/:rid", async (req, res) => {
  try {
    const { id, rid } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id) || !mongoose.Types.ObjectId.isValid(rid)) {
      return res.status(404).json({ code: "not_found" });
    }
    const grant = await getActiveGrant(id, req.user._id);
    if (!grant) return res.status(403).json({ code: "access_denied" });

    // لازم تكون آخر روشتة كتبها هذا الطبيب لهذا المريض
    const latest = await Prescription.findOne({ patientId: id, doctorId: req.user._id }).sort({ date: -1 });
    if (!latest || String(latest._id) !== String(rid)) {
      return res.status(403).json({ code: "not_latest_rx" });
    }

    const b = req.body || {};
    const items = (Array.isArray(b.items) ? b.items : []).map((m) => ({
      name: String((m && m.name) || "").trim().slice(0, 120),
      dose: String((m && m.dose) || "").trim().slice(0, 120),
      duration: String((m && m.duration) || "").trim().slice(0, 120),
    }));
    if (items.length === 0 || items.length > 30 || items.some((m) => !m.name || !m.dose || !m.duration)) {
      return res.status(400).json({ code: "invalid_data" });
    }

    const tests = (Array.isArray(b.tests) ? b.tests : []).slice(0, 40).map((x) => {
      const name = String(typeof x === "string" ? x : (x && x.name) || "").trim().slice(0, 120);
      return name ? { name, kind: x && x.kind === "xray" ? "xray" : "lab" } : null;
    }).filter(Boolean);

    const num = (v, min, max, dflt) => {
      const n = Math.round(Number(v));
      return Number.isFinite(n) && n >= min && n <= max ? n : dflt;
    };

    latest.diagnosis = String(b.diagnosis || "").trim().slice(0, 500);
    latest.items = items;
    latest.tests = tests;
    latest.followUpDays = num(b.followUpDays, 1, 365, null);
    latest.graceDays = num(b.graceDays, 1, 60, 0);
    await latest.save();

    logAccess(id, req.user, "updated_prescription", latest._id);
    return res.json({ ok: true });
  } catch (error) {
    console.error("Doctor update prescription error:", error);
    return res.status(500).json({ code: "server_error" });
  }
});

router.get("/patients/:id/file", async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(404).json({ code: "not_found" });
    }

    const grant = await getActiveGrant(id, req.user._id);

    if (!grant) {
      return res.status(403).json({ code: "access_denied" });
    }

    logAccess(id, req.user, "viewed_file");

    const [patient, record, prescriptions, labResults] =
      await Promise.all([
        User.findOne({
          _id: id,
          role: "patient",
        }).select("name phone profile password createdByDoctor"),

        MedicalRecord.findOne({ patientId: id }).lean(),

        Prescription.find({
          patientId: id,
          doctorId: req.user._id,
        })
          .populate("doctorId", "name extra specialty")
          .sort({ date: -1 })
          .lean(),

        LabResult.find({ patientId: id })
          .sort({ createdAt: -1 })
          .lean(),
      ]);

    if (!patient) {
      return res.status(404).json({ code: "not_found" });
    }

    const profile = patient.profile || {};

    return res.json({
      id: patient._id.toString(),
      name: patient.name || "",
      editable: isManagedPatient(patient, req.user._id),
      canEditData: isManagedPatient(patient, req.user._id),
      chronicIds: (Array.isArray(profile.chronicIds) ? profile.chronicIds : []).filter((cid) => CHRONIC.some((c) => c.id === cid)),
      chronicOther: cleanOther(profile.chronicOther),

      info: {
        birthDate: profile.birthDate || "",
        age: getAge(profile.birthDate),
        blood: profile.blood || "",
        height: profile.height || "",
        weight: profile.weight || "",
      },

      // الواجهة تعرض الاسم ثنائي اللغة، فنحوّل المعرّفات (diabetes ...) إلى {ar, en}
      chronic: (Array.isArray(profile.chronicIds) ? profile.chronicIds : [])
        .map((cid) => CHRONIC.find((c) => c.id === cid))
        .filter(Boolean)
        .map((c) => ({ ar: c.ar, en: c.en }))
        .concat((Array.isArray(profile.chronicOther) ? profile.chronicOther : []).map((x) => ({ ar: x, en: x }))),

      history: (record?.history || []).map((item) => ({
        id: item._id?.toString() || "",
        condition: item.condition || "",
        date: item.date || "",
        notes: item.notes || "",
      })),

      prescriptions: prescriptions.map((rx, i) => ({
        id: rx._id.toString(),
        doctor: rx.doctorId?.name || "",
        specialty: specialtyView(rx.doctorId?.specialty || rx.doctorId?.extra),
        visit: rx.visit || "consultation",
        date: rx.date,
        diagnosis: rx.diagnosis || "",
        items: rx.items || [],
        tests: (rx.tests || []).map((x) => ({ name: x.name, kind: x.kind })),
        followUpDays: rx.followUpDays || null,
        graceDays: rx.graceDays || 0,
        // آخر روشتة كتبها هذا الطبيب للمريض: يقدر يعدّلها
        editable: i === 0,
        current: rx.current,
      })),

      results: labResults.map((result) => ({
        id: result._id.toString(),
        kind: result.kind || "lab",
        title: result.title || result.fileName || "نتيجة تحليل",
        source: result.byDoctor ? "الطبيب" : "معمل",
        byDoctor: !!result.byDoctor,
        date: result.uploadedAt || result.createdAt,
        status: result.status || "normal",
        // ملف النتيجة الذي رفعه المعمل (يُفتح بعد التحقق من صلاحية الطبيب)
        name: result.fileName || "",
        type:
          path.extname(result.fileName || "").toLowerCase() === ".pdf" ||
          result.fileType === "application/pdf"
            ? "pdf"
            : "image",
        url: result.filePath
          ? `/api/doctor/patients/${id}/results/${result._id}/file`
          : "",
      })),

      reports: (record?.reports || []).map((report) => {
        const fileName = report.name || report.fileName || "";
        const extension = path.extname(fileName).toLowerCase();

        return {
          id: report._id.toString(),
          name: fileName,
          date: report.uploadedAt,
          size: report.size || 0,
          type:
            extension === ".pdf" ||
            report.fileType === "application/pdf"
              ? "pdf"
              : "image",
          url: `/api/doctor/patients/${id}/reports/${report._id}/file`,
        };
      }),
    });
  } catch (error) {
    console.error("Get doctor patient file error:", error);
    return res.status(500).json({ code: "server_error" });
  }
});

// Open a lab/radiology result file (uploaded by the lab) after checking permission
router.get(
  "/patients/:patientId/results/:resultId/file",
  async (req, res) => {
    try {
      const { patientId, resultId } = req.params;

      if (
        !mongoose.Types.ObjectId.isValid(patientId) ||
        !mongoose.Types.ObjectId.isValid(resultId)
      ) {
        return res.status(404).json({ code: "not_found" });
      }

      const grant = await getActiveGrant(patientId, req.user._id);

      if (!grant) {
        return res.status(403).json({ code: "access_denied" });
      }

      const result = await LabResult.findOne({ _id: resultId, patientId });

      if (!result || !result.filePath) {
        return res.status(404).json({ code: "not_found" });
      }

      const uploadsDir = path.resolve(__dirname, "../uploads");
      const filePath = path.resolve(__dirname, "..", result.filePath);

      if (
        !filePath.startsWith(uploadsDir + path.sep) ||
        !fs.existsSync(filePath)
      ) {
        return res.status(404).json({ code: "file_not_found" });
      }

      logAccess(patientId, req.user, "viewed_file");

      if (result.fileType) res.type(result.fileType);
      return res.sendFile(filePath);
    } catch (error) {
      console.error("Doctor result file error:", error);
      return res.status(500).json({ code: "server_error" });
    }
  }
);

// Open patient report after checking permission
router.get(
  "/patients/:patientId/reports/:reportId/file",
  async (req, res) => {
    try {
      const { patientId, reportId } = req.params;

      if (
        !mongoose.Types.ObjectId.isValid(patientId) ||
        !mongoose.Types.ObjectId.isValid(reportId)
      ) {
        return res.status(404).json({ code: "not_found" });
      }

      const grant = await getActiveGrant(
        patientId,
        req.user._id
      );

      if (!grant) {
        return res.status(403).json({ code: "access_denied" });
      }

      const record = await MedicalRecord.findOne({
        patientId,
      });

      const report = record?.reports.id(reportId);

      if (!report) {
        return res.status(404).json({ code: "not_found" });
      }

      const uploadsDir = path.resolve(__dirname, "../uploads");

      const filePath = path.resolve(
        __dirname,
        "..",
        report.filePath
      );

      if (
        !filePath.startsWith(uploadsDir + path.sep) ||
        !fs.existsSync(filePath)
      ) {
        return res.status(404).json({ code: "file_not_found" });
      }

      return res.sendFile(filePath);
    } catch (error) {
      console.error("Doctor report file error:", error);
      return res.status(500).json({ code: "server_error" });
    }
  }
);

// ===============================
// Save exam
// ===============================

router.post("/exams", async (req, res) => {
  try {
    const doctorId = req.user.id || req.user._id;

    const {
      patientId,
      bookingId,
      diagnosis,
      visit,
      meds,
      tests,
      followUpDays,
      graceDays,
    } = req.body;

    if (
      !patientId ||
      !mongoose.Types.ObjectId.isValid(patientId) ||
      !bookingId ||
      !mongoose.Types.ObjectId.isValid(bookingId)
    ) {
      return res.status(400).json({
        message: "Invalid patient or booking ID",
      });
    }

    if (!Array.isArray(meds) || !Array.isArray(tests)) {
      return res.status(400).json({
        message: "Invalid exam data",
      });
    }

    const grant = await getActiveGrant(patientId, doctorId);

    if (!grant) {
      return res.status(403).json({
        message: "You do not have access to this patient",
      });
    }

    const booking = await Booking.findOne({
      _id: bookingId,
      patientId,
      providerId: doctorId,
      kind: "doctor",
      status: { $in: ["pending", "confirmed"] },
    });

    if (!booking) {
      return res.status(404).json({
        message: "Appointment not found or already completed",
      });
    }

    const patient = await User.findById(patientId);

    if (!patient || patient.role !== "patient") {
      return res.status(404).json({
        message: "Patient not found",
      });
    }

    const items = meds.map((med) => ({
      name: String(med.name || "").trim(),
      dose: String(med.dose || "").trim(),
      duration: String(med.duration || "").trim(),
    }));

    if (
      items.some(
        (med) => !med.name || !med.dose || !med.duration
      )
    ) {
      return res.status(400).json({
        message: "Medicine name, dose and duration are required",
      });
    }

    const isXray = (name) => {
      const value = String(name || "").toLowerCase();

      return [
        "أشعة",
        "اشعة",
        "رنين",
        "موجات صوتية",
        "مقطعية",
        "x-ray",
        "xray",
        "mri",
        "ct scan",
        "ultrasound",
      ].some((word) => value.includes(word));
    };

    const cleanTests = tests
      .map((test) => {
        const name = String(
          typeof test === "string"
            ? test
            : test?.name || ""
        ).trim();

        if (!name) return null;

        const suppliedKind =
          typeof test === "object" && test?.kind
            ? test.kind
            : null;

        const kind = ["lab", "xray"].includes(suppliedKind)
          ? suppliedKind
          : isXray(name)
            ? "xray"
            : "lab";

        return {
          name,
          kind,
        };
      })
      .filter(Boolean);

    const prescriptionTests = cleanTests.map((test) => ({
      name: test.name,
      kind: test.kind,
    }));

    const prescription = await Prescription.create({
      patientId,
      doctorId,
      bookingId: booking._id,
      diagnosis: String(diagnosis || "").trim(),
      visit: visit || "new",
      // الطبيب هو من يحدد أيام إعادة الكشف وفترة السماح (السماح اختياري)
      followUpDays: (() => {
        const n = Math.round(Number(followUpDays));
        return Number.isFinite(n) && n >= 1 && n <= 365 ? n : null;
      })(),
      graceDays: (() => {
        const n = Math.round(Number(graceDays));
        return Number.isFinite(n) && n >= 1 && n <= 60 ? n : 0;
      })(),
      items,
      tests: prescriptionTests,
    });

    logAccess(patientId, req.user, "added_prescription", prescription._id);

    booking.status = "done";
    booking.examinedAt = new Date();

    await booking.save();

    return res.status(201).json({
      message: "exam_saved",
      prescriptionId: prescription._id,
      testsCount: prescriptionTests.length,
      bookingStatus: booking.status,
    });
  } catch (error) {
    console.error("Save exam error:", error);

    return res.status(500).json({
      message: "Failed to save exam",
      error: error.message,
    });
  }
});

// ===============================
// Doctor Professional Profile
// ===============================

// Get professional profile
router.get("/professional", async (req, res) => {
  try {
    const doctor = await User.findById(req.user._id).select(
      "name specialty license clinic address licenseStatus certificate certificateName certificateType"
    );

    if (!doctor) {
      return res.status(404).json({ code: "not_found" });
    }

    let licenseFile = null;

    if (doctor.certificate) {
      const uploadsDir = path.resolve(__dirname, "../uploads");
      const filePath = path.resolve(
        uploadsDir,
        path.basename(doctor.certificate)
      );

      if (
        filePath.startsWith(uploadsDir + path.sep) &&
        fs.existsSync(filePath)
      ) {
        const mimeType = doctor.certificateType || "application/pdf";
        const data = fs.readFileSync(filePath).toString("base64");

        licenseFile = {
          name: doctor.certificateName || "license",
          type: mimeType,
          dataUrl: `data:${mimeType};base64,${data}`,
        };
      }
    }

    return res.json({
      license: doctor.license || "",
      specialty: doctor.specialty || doctor.extra || "",
      clinic: doctor.clinic || "",
      address: doctor.address || "",
      followUpDays: doctor.followUpDays || 14,
      licenseStatus: doctor.licenseStatus || "pend",
      certificateName: doctor.certificateName || "",
      certificateType: doctor.certificateType || "",
      licenseFile,
    });
  } catch (error) {
    console.error("Get professional profile error:", error);
    return res.status(500).json({ code: "server_error" });
  }
});

// Update professional profile
router.put("/professional", async (req, res) => {
  try {
    // التخصص يُحدد عند التسجيل فقط ولا يُعدَّل من هنا (يتجاهله الخادم حتى لو أُرسل)
    const { license, clinic, address, followUpDays } = req.body;

    const doctor = await User.findById(req.user._id);

    if (!doctor) {
      return res.status(404).json({ code: "not_found" });
    }

    if (followUpDays !== undefined) {
      const n = Math.round(Number(followUpDays));
      if (Number.isFinite(n) && n >= 1 && n <= 365) doctor.followUpDays = n;
    }
    if (license !== undefined) doctor.license = String(license).trim();
    if (clinic !== undefined) doctor.clinic = String(clinic).trim();
    if (address !== undefined) doctor.address = String(address).trim();

    await doctor.save();

    return res.json({
      license: doctor.license,
      specialty: doctor.specialty || doctor.extra || "",
      clinic: doctor.clinic,
      address: doctor.address,
      followUpDays: doctor.followUpDays || 14,
      licenseStatus: doctor.licenseStatus,
    });
  } catch (error) {
    console.error("Update professional profile error:", error);
    return res.status(500).json({ code: "server_error" });
  }
});

// Upload license file
router.post("/license-file", uploadCertificate, async (req, res) => {
  let savedNewFile = false;

  try {
    if (!req.file) {
      return res.status(400).json({ code: "invalid_data" });
    }

    const doctor = await User.findById(req.user._id);

    if (!doctor) {
      if (req.file.path && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }

      return res.status(404).json({ code: "not_found" });
    }

    const oldCertificate = doctor.certificate;

    doctor.certificate = req.file.filename;
    doctor.certificateName = req.file.originalname;
    doctor.certificateType = req.file.mimetype;

    await doctor.save();
    savedNewFile = true;

    // Delete old file only after the new file is saved successfully
    if (oldCertificate) {
      const uploadsDir = path.resolve(__dirname, "../uploads");
      const oldPath = path.resolve(
        uploadsDir,
        path.basename(oldCertificate)
      );

      if (
        oldPath.startsWith(uploadsDir + path.sep) &&
        fs.existsSync(oldPath) &&
        oldPath !== path.resolve(req.file.path)
      ) {
        fs.unlinkSync(oldPath);
      }
    }

    const data = fs.readFileSync(req.file.path).toString("base64");

    return res.json({
      license: doctor.license || "",
      specialty: doctor.specialty || "",
      clinic: doctor.clinic || "",
      address: doctor.address || "",
      licenseStatus: doctor.licenseStatus || "pend",
      certificateName: doctor.certificateName,
      certificateType: doctor.certificateType,
      licenseFile: {
        name: doctor.certificateName,
        type: doctor.certificateType,
        dataUrl: `data:${doctor.certificateType};base64,${data}`,
      },
    });
  } catch (error) {
    console.error("Upload license error:", error);

    // Delete the new file only if it was not saved as the doctor's certificate
    if (
      !savedNewFile &&
      req.file?.path &&
      fs.existsSync(req.file.path)
    ) {
      fs.unlinkSync(req.file.path);
    }

    return res.status(500).json({ code: "server_error" });
  }
});

// Delete license file
router.delete("/license-file", async (req, res) => {
  try {
    const doctor = await User.findById(req.user._id);

    if (!doctor) {
      return res.status(404).json({ code: "not_found" });
    }

    if (doctor.certificate) {
      const uploadsDir = path.resolve(__dirname, "../uploads");
      const filePath = path.resolve(
        uploadsDir,
        path.basename(doctor.certificate)
      );

      if (
        filePath.startsWith(uploadsDir + path.sep) &&
        fs.existsSync(filePath)
      ) {
        fs.unlinkSync(filePath);
      }
    }

    doctor.certificate = "";
    doctor.certificateName = "";
    doctor.certificateType = "";

    await doctor.save();

    return res.json({ success: true });
  } catch (error) {
    console.error("Delete license file error:", error);
    return res.status(500).json({ code: "server_error" });
  }
});

// ===== Clinic Team =====

// عرض موظفي الاستقبال التابعين للدكتور
router.get("/team", async (req, res) => {
  try {
    const team = await User.find({
      role: "reception",
      doctorId: req.user._id,
    })
      .select("name email perms status")
      .sort({ createdAt: -1 })
      .lean();

    res.json(
      team.map((member) => ({
        id: member._id.toString(),
        name: member.name,
        email: member.email,
        perms: member.perms || [true, true, true],
        status: member.status,
      }))
    );
  } catch (error) {
    console.error("GET doctor team:", error);
    res.status(500).json({ message: "server_error" });
  }
});

// إضافة موظف استقبال - الحساب ينتظر موافقة الأدمن
router.post("/team", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name?.trim() || name.trim().length < 2) {
      return res.status(400).json({ message: "invalid_name" });
    }

    const normalizedEmail = String(email || "").trim().toLowerCase();

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      return res.status(400).json({ message: "invalid_email" });
    }

    if (
      typeof password !== "string" ||
      password.length < 8 ||
      !/[A-Za-z]/.test(password) ||
      !/[0-9]/.test(password)
    ) {
      return res.status(400).json({ message: "weak_password" });
    }

    const exists = await User.findOne({ email: normalizedEmail });

    if (exists) {
      return res.status(409).json({ message: "email_exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const staff = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      password: hashedPassword,
      role: "reception",
      status: "pending",
      doctorId: req.user._id,
      perms: [true, true, true],
    });

    res.status(201).json({
      id: staff._id.toString(),
      name: staff.name,
      email: staff.email,
      perms: staff.perms,
      status: staff.status,
    });
  } catch (error) {
    console.error("POST doctor team:", error);
    res.status(500).json({ message: "server_error" });
  }
});

// تعديل صلاحيات الموظف
router.patch("/team/:id", async (req, res) => {
  try {
    const { perms } = req.body;

    if (
      !Array.isArray(perms) ||
      perms.length !== 3 ||
      !perms.every((value) => typeof value === "boolean")
    ) {
      return res.status(400).json({ message: "invalid_permissions" });
    }

    const staff = await User.findOneAndUpdate(
      {
        _id: req.params.id,
        role: "reception",
        doctorId: req.user._id,
      },
      { $set: { perms } },
      { new: true }
    ).select("name email perms status");

    if (!staff) {
      return res.status(404).json({ message: "staff_not_found" });
    }

    res.json({
      id: staff._id.toString(),
      name: staff.name,
      email: staff.email,
      perms: staff.perms,
      status: staff.status,
    });
  } catch (error) {
    console.error("PATCH doctor team:", error);
    res.status(500).json({ message: "server_error" });
  }
});

// حذف موظف الاستقبال التابع للدكتور
router.delete("/team/:id", async (req, res) => {
  try {
    const staff = await User.findOneAndDelete({
      _id: req.params.id,
      role: "reception",
      doctorId: req.user._id,
    });

    if (!staff) {
      return res.status(404).json({ message: "staff_not_found" });
    }

    res.json({ ok: true });
  } catch (error) {
    console.error("DELETE doctor team:", error);
    res.status(500).json({ message: "server_error" });
  }
});



function cleanDays(days) {
  if (!Array.isArray(days) || days.length !== 7) return null;
  const hhmm = /^([01]\d|2[0-3]):[0-5]\d$/;
  const out = [];
  for (const d of days) {
    const from = String((d && d.from) || "").slice(0, 5);
    const to = String((d && d.to) || "").slice(0, 5);
    if (!hhmm.test(from) || !hhmm.test(to)) return null;
    out.push({ on: !!(d && d.on), from, to });
  }
  return out;
}

// الترتيب من السبت (٠) إلى الجمعة (٦): الافتراضي الأحد–الخميس
const DEFAULT_SCHEDULE = Array.from({ length: 7 }, (_, i) => ({ on: i >= 1 && i <= 5, from: "10:00", to: "17:00" }));

// مواعيد عمل الطبيب
router.get("/schedule", async (req, res) => {
  try {
    const doctor = await User.findById(req.user._id).select("schedule");
    res.json(
      doctor && doctor.schedule && doctor.schedule.length === 7
        ? doctor.schedule
        : DEFAULT_SCHEDULE
    );
  } catch (error) {
    console.error("Get schedule error:", error);
    res.status(500).json({ code: "server_error" });
  }
});

router.put("/schedule", async (req, res) => {
  try {
    const days = cleanDays(req.body.days);
    if (!days) return res.status(400).json({ code: "invalid_data" });
    await User.updateOne({ _id: req.user._id }, { $set: { schedule: days } });
    res.json(days);
  } catch (error) {
    console.error("Update schedule error:", error);
    res.status(500).json({ code: "server_error" });
  }
});

module.exports = router;
