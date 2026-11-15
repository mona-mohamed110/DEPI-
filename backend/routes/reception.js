
const express = require("express");
const mongoose = require("mongoose");

const User = require("../models/User");
const Booking = require("../models/Booking");
const AccessGrant = require("../models/AccessGrant");
const { requireAuth, requireRole } = require("../middleware/auth");

const router = express.Router();

router.use(requireAuth, requireRole("reception"));

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
      role: "doctor",
      status: "active",
      licenseStatus: "ok",
    })
      .select("name specialty extra")
      .sort({ name: 1 });

    res.json(
      doctors.map((doctor) => ({
        id: String(doctor._id),
        name: doctor.name,
        specialty: doctor.specialty || doctor.extra || "",
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
    const patients = await User.find({ role: "patient" })
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

    if (name.length < 3 || name.length > 80 || !isValidEgyptPhone(phone)) {
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
    })
      .populate("patientId", "name phone")
      .populate("providerId", "name")
      .sort({ createdAt: -1 });

    res.json(requests.map(requestRow));
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

    res.json(requestRow(populated));
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
      },
      { $set: { status: "rejected" } },
      { new: true }
    );

    if (!booking) {
      return res.status(404).json({ code: "not_found" });
    }

    res.json({ ok: true, id: String(booking._id) });
  } catch (error) {
    console.error("Reception reject request error:", error);
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
    })
      .populate("patientId", "name phone")
      .populate("providerId", "name")
      .sort({ time: 1 });

    res.json(bookings.map(queueRow));
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
// حجز موعد من الاستقبال
// POST /api/reception/appointments
// ========================================
router.post("/appointments", async function (req, res) {
  try {
    const patientId = req.body.patientId;
    const providerId = req.body.providerId;
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
      _id: patientId,
      role: "patient",
      status: "active",
    });

    if (!patient) {
      return res.status(404).json({ code: "patient_not_found" });
    }

    const doctor = await User.findOne({
      _id: providerId,
      role: "doctor",
      status: "active",
      licenseStatus: "ok",
    });

    if (!doctor) {
      return res.status(404).json({ code: "doctor_not_found" });
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

    const booking = await Booking.create({
      patientId,
      providerId,
      kind: "doctor",
      date,
      time,
      status: "confirmed",
      queue: "not-arrived",
      source: "reception",
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

    res.status(201).json(recordRow(populated));
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
