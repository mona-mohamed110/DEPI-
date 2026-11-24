
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
const { uploadCertificate } = require("../middleware/upload");

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

    const appointments = allBookings
      .filter((item) => getDisplayDate(item) === selectedDate)
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
      .select("_id patientId date time status")
      .lean();

    const activeBookingMap = new Map();

    for (const booking of activeBookings) {
      const patientId = booking.patientId.toString();

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
        }).select("name phone profile"),

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
        .map((c) => ({ ar: c.ar, en: c.en })),

      history: (record?.history || []).map((item) => ({
        id: item._id?.toString() || "",
        condition: item.condition || "",
        date: item.date || "",
        notes: item.notes || "",
      })),

      prescriptions: prescriptions.map((rx) => ({
        id: rx._id.toString(),
        doctor: rx.doctorId?.name || "",
        specialty: specialtyView(rx.doctorId?.specialty || rx.doctorId?.extra),
        visit: rx.visit || "consultation",
        date: rx.date,
        diagnosis: rx.diagnosis || "",
        items: rx.items || [],
        current: rx.current,
      })),

      results: labResults.map((result) => ({
        id: result._id.toString(),
        kind: result.kind || "lab",
        title: result.title || result.fileName || "نتيجة تحليل",
        source: "معمل",
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

const DEFAULT_SCHEDULE = Array.from({ length: 7 }, (_, i) => ({ on: i < 5, from: "10:00", to: "17:00" }));

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
