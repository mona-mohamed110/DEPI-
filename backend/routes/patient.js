
const express = require("express");
const mongoose = require("mongoose");
const fs = require("fs");
const path = require("path");
const Prescription = require("../models/Prescription");
const AccessGrant = require("../models/AccessGrant");
const { withinHours } = require("../utils/schedule");
const AccessRequest = require("../models/AccessRequest");
const Booking = require("../models/Booking");
const User = require("../models/User");
const MedicalRecord = require("../models/MedicalRecord");
const { uploadMultiple } = require("../middleware/upload");
const LabRequest = require("../models/LabRequest");
const LabResult = require("../models/LabResult");

const { CHRONIC, specialtyView } = require("../data/catalog");
const AccessLog = require("../models/AccessLog");
const { logAccess, ACTION_LABELS } = require("../utils/accessLog");
const { requireAuth, requireRole } = require("../middleware/auth");

const router = express.Router();

router.use(requireAuth, requireRole("patient"));

function bookingRow(booking) {
  return {
    id: booking._id.toString(),
    kind: booking.kind,
    providerId:
      booking.providerId?._id?.toString() ||
      booking.providerId?.toString(),
    doctor: booking.providerId?.name || "",
    specialty: specialtyView(booking.providerId?.specialty || booking.providerId?.extra),
    date: booking.date,
    time: booking.time,
    status: booking.status,
    test: booking.test || "",
    queue: booking.queue,
    rejectReason: booking.rejectReason || "",
    rejectNew: booking.status === "rejected" && booking.rejectSeen === false,
  };
}

// تنبيهات رفض الحجز التي لم يطّلع عليها المريض
router.get("/rejections/count", async (req, res) => {
  try {
    const count = await Booking.countDocuments({ patientId: req.user._id, status: "rejected", rejectSeen: false });
    res.json({ count });
  } catch (error) {
    res.status(500).json({ code: "server_error" });
  }
});

router.post("/rejections/seen", async (req, res) => {
  try {
    await Booking.updateMany({ patientId: req.user._id, status: "rejected", rejectSeen: false }, { $set: { rejectSeen: true } });
    res.json({ ok: true });
  } catch (error) {
    res.status(500).json({ code: "server_error" });
  }
});

// عرض حجوزات المريض
router.get("/appointments", async (req, res) => {
  try {
    const bookings = await Booking.find({
      patientId: req.user._id,
    })
      .populate("providerId", "name extra specialty")
      .sort({ date: 1, time: 1 });

    return res.json(bookings.map(bookingRow));
  } catch (error) {
    console.error("Get patient appointments error:", error);
    return res.status(500).json({ code: "server_error" });
  }
});

// المواعيد المحجوزة فعلاً عند طبيب/معمل في يوم معيّن (لإخفائها من قائمة الأوقات)
router.get("/booked-slots", async (req, res) => {
  try {
    const { providerId, date } = req.query;
    if (!mongoose.Types.ObjectId.isValid(providerId) || !/^\d{4}-\d{2}-\d{2}$/.test(String(date || ""))) {
      return res.status(400).json({ code: "invalid_data" });
    }
    const list = await Booking.find({ providerId, date: String(date), status: { $in: ["pending", "confirmed"] } }).select("time");
    res.json({ times: list.map((b) => b.time) });
  } catch (error) {
    res.status(500).json({ code: "server_error" });
  }
});

// إنشاء حجز جديد لطبيب أو معمل
router.post("/appointments", async (req, res) => {
  try {
    const providerId = req.body.providerId || req.body.doctorId;
    const { date, time, test } = req.body;

    if (
      !mongoose.Types.ObjectId.isValid(providerId) ||
      !date ||
      !time
    ) {
      return res.status(400).json({ code: "invalid_data" });
    }

    const provider = await User.findOne({
      _id: providerId,
      role: { $in: ["doctor", "lab"] },
      status: "active",
    });

    if (!provider) {
      return res.status(404).json({
        code: "provider_not_found",
      });
    }

    const kind = provider.role;

    if (!withinHours(provider, String(date), String(time))) {
      return res.status(400).json({ code: "outside_hours" });
    }

    const existingBooking = await Booking.findOne({
      providerId,
      date,
      time,
      status: { $in: ["pending", "confirmed"] },
    });

    if (existingBooking) {
      return res.status(409).json({
        code: "slot_unavailable",
      });
    }

    const booking = await Booking.create({
      patientId: req.user._id,
      providerId,
      kind,
      date,
      time,
      test: test || "",
      status: "pending",
    });

    // إنشاء طلب تلقائي في لوحة المعمل
    if (kind === "lab") {
      const birthDate = req.user.profile?.birthDate;
      let age = 0;

      if (birthDate) {
        const today = new Date();
        const birth = new Date(birthDate);

        age = today.getFullYear() - birth.getFullYear();

        const beforeBirthday =
          today.getMonth() < birth.getMonth() ||
          (today.getMonth() === birth.getMonth() &&
            today.getDate() < birth.getDate());

        if (beforeBirthday) age--;
      }

      await LabRequest.create({
        labId: providerId,
        patientId: req.user._id,
        bookingId: booking._id,
        name: req.user.name,
        sex: "unknown",
        age,
        phone: req.user.phone || "",
        test: test || "تحليل",
        kind: "lab",
        status: "new",
      });
    }

    // منح الطبيب صلاحية الوصول للملف الطبي
    if (kind === "doctor") {
      await AccessGrant.findOneAndUpdate(
        {
          patientId: req.user._id,
          doctorId: providerId,
        },
        {
          $set: {
            status: "active",
            revokedAt: null,
            bookingId: booking._id,
          },
          $setOnInsert: {
            patientId: req.user._id,
            doctorId: providerId,
            grantedAt: new Date(),
          },
        },
        {
          upsert: true,
          new: true,
        }
      );
    }

    const result = await Booking.findById(booking._id)
      .populate("providerId", "name extra specialty");

    return res.status(201).json(bookingRow(result));
  } catch (error) {
    console.error("Create patient appointment error:", error);
    return res.status(500).json({ code: "server_error" });
  }
});

// تعديل موعد الحجز
router.patch("/appointments/:id", async (req, res) => {
  try {
    const { date, time } = req.body;

    if (!date || !time) {
      return res.status(400).json({ code: "invalid_data" });
    }

    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(404).json({ code: "not_found" });
    }

    const booking = await Booking.findOne({
      _id: req.params.id,
      patientId: req.user._id,
      status: { $in: ["pending", "confirmed"] },
    });

    if (!booking) {
      return res.status(404).json({ code: "not_found" });
    }

    const provider = await User.findById(booking.providerId).select("role schedule labProfile");
    if (provider && !withinHours(provider, String(date), String(time))) {
      return res.status(400).json({ code: "outside_hours" });
    }

    const conflict = await Booking.findOne({
      _id: { $ne: booking._id },
      providerId: booking.providerId,
      date,
      time,
      status: { $in: ["pending", "confirmed"] },
    });

    if (conflict) {
      return res.status(409).json({
        code: "slot_unavailable",
      });
    }

    booking.date = date;
    booking.time = time;
    booking.status = "pending";

    await booking.save();

    const result = await Booking.findById(booking._id)
      .populate("providerId", "name extra specialty");

    return res.json(bookingRow(result));
  } catch (error) {
    console.error("Update patient appointment error:", error);
    return res.status(500).json({ code: "server_error" });
  }
});

// إلغاء الحجز
router.delete("/appointments/:id", async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(404).json({ code: "not_found" });
    }

    const booking = await Booking.findOneAndUpdate(
      {
        _id: req.params.id,
        patientId: req.user._id,
        status: { $in: ["pending", "confirmed"] },
      },
      { status: "cancelled" },
      { new: true }
    );

    if (!booking) {
      return res.status(404).json({ code: "not_found" });
    }

    return res.json({ success: true });
  } catch (error) {
    console.error("Cancel patient appointment error:", error);
    return res.status(500).json({ code: "server_error" });
  }
});


// لوحة تحكم المريض
router.get("/dashboard", async (req, res) => {
  try {
    const patientId = req.user._id;

    const now = new Date();
    const today = [
      now.getFullYear(),
      String(now.getMonth() + 1).padStart(2, "0"),
      String(now.getDate()).padStart(2, "0"),
    ].join("-");

    const [bookings, results, permCount, rxCount, latestRx] =
      await Promise.all([
        Booking.find({
          patientId,
          date: { $gte: today },
          status: { $in: ["pending", "confirmed"] },
        })
          .populate("providerId", "name extra specialty")
          .sort({ date: 1, time: 1 })
          .limit(5),

        LabResult.find({ patientId })
          .sort({ createdAt: -1 })
          .limit(5),

        AccessGrant.countDocuments({
          patientId,
          status: "active",
        }),

        Prescription.countDocuments({
          patientId,
          current: true,
        }),

        Prescription.findOne({ patientId })
          .populate("doctorId", "name extra specialty")
          .sort({ date: -1 })
          .lean(),
      ]);

    const next = bookings[0] || null;

    return res.json({
      next: next
        ? {
            date: next.date,
            time: next.time,
          }
        : null,

      rxCount,

      latestRx: latestRx
        ? {
            id: latestRx._id.toString(),
            doctor: latestRx.doctorId?.name || "",
            specialty: specialtyView(latestRx.doctorId?.specialty || latestRx.doctorId?.extra),
            visit: latestRx.visit,
            date: latestRx.date,
            diagnosis: latestRx.diagnosis,
            items: latestRx.items || [],
            tests: latestRx.tests || [],
            current: latestRx.current,
          }
        : null,

      permCount,

      upcoming: bookings.map((booking) => ({
        id: booking._id.toString(),
        doctor: booking.providerId?.name || "مقدم الخدمة",
        specialty: specialtyView(booking.providerId?.specialty || booking.providerId?.extra),
        date: booking.date,
        time: booking.time,
        status: booking.status,
      })),

      alerts: results.map((result) => ({
        title: result.fileName || "نتيجة جديدة",
      })),
    });
  } catch (error) {
    console.error("Get patient dashboard error:", error);
    return res.status(500).json({ code: "server_error" });
  }
});


// عرض نتائج التحاليل الخاصة بالمريض
router.get("/results", async (req, res) => {
  try {
    const results = await LabResult.find({
      patientId: req.user._id,
    })
      .populate("labId", "name")
      .sort({ createdAt: -1 });

    return res.json(
      results.map((item) => ({
        id: item._id.toString(),
        kind: item.kind || "lab",
        title: item.title || item.fileName,
        source: item.labId?.name || "المعمل",
        date: item.createdAt,
        status: item.status || "normal",
        fileUrl: `/api/patient/results/${item._id}/file`,
      }))
    );
  } catch (error) {
    console.error("Get patient results error:", error);
    return res.status(500).json({ code: "server_error" });
  }
});

// فتح ملف نتيجة التحليل
router.get("/results/:id/file", async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(404).json({ code: "not_found" });
    }

    const result = await LabResult.findOne({
      _id: req.params.id,
      patientId: req.user._id,
    });

    if (!result) {
      return res.status(404).json({ code: "not_found" });
    }

    const filePath = path.resolve(
      __dirname,
      "..",
      result.filePath
    );

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        code: "file_not_found",
      });
    }

    return res.sendFile(filePath);
  } catch (error) {
    console.error("Open patient result error:", error);
    return res.status(500).json({ code: "server_error" });
  }
});

// ========================================
// Patient Medical File
// ========================================

// عرض الملف الطبي
router.get("/medical-file", async (req, res) => {
  try {
    const patientId = req.user._id;

    const [user, record] = await Promise.all([
      User.findById(patientId).select("profile"),
      MedicalRecord.findOne({ patientId }),
    ]);

    if (!user) {
      return res.status(404).json({ code: "not_found" });
    }

    const profile = user.profile || {};
    let age = null;

    if (profile.birthDate) {
      const birthDate = new Date(profile.birthDate);

      if (!Number.isNaN(birthDate.getTime())) {
        const today = new Date();
        age = today.getFullYear() - birthDate.getFullYear();

        const birthdayNotReached =
          today.getMonth() < birthDate.getMonth() ||
          (today.getMonth() === birthDate.getMonth() &&
            today.getDate() < birthDate.getDate());

        if (birthdayNotReached) age--;
      }
    }

    return res.json({
      info: {
        age,
        blood: profile.blood || "",
        height: profile.height || "",
        weight: profile.weight || "",
      },

      chronic: [
        ...(profile.chronicIds || [])
          .map((id) => CHRONIC.find((c) => c.id === id))
          .filter(Boolean)
          .map((c) => ({ ar: c.ar, en: c.en })),
        ...cleanOther(profile.chronicOther).map((x) => ({ ar: x, en: x })),
      ],

      history: (record?.history || []).map((item) => ({
        id: item._id.toString(),
        condition: item.condition,
        date: item.date,
        notes: item.notes,
      })),

      reports: (record?.reports || []).map((item) => ({
        id: item._id.toString(),
        name: item.name,
        date: item.uploadedAt,
        size: item.size,
        type: item.fileType,
        url: `/patient/reports/${item._id}/file`,
      })),
    });
  } catch (error) {
    console.error("Get medical file error:", error);
    return res.status(500).json({ code: "server_error" });
  }
});

// إضافة تاريخ مرضي
router.post("/history", async (req, res) => {
  try {
    const condition = String(req.body.condition || "").trim();
    const date = String(req.body.date || "").trim();
    const notes = String(req.body.notes || "").trim();

    if (!condition || condition.length > 200 || notes.length > 1000) {
      return res.status(400).json({ code: "invalid_data" });
    }

    const record = await MedicalRecord.findOneAndUpdate(
      { patientId: req.user._id },
      {
        $push: {
          history: { condition, date, notes },
        },
      },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    const item = record.history[record.history.length - 1];

    return res.status(201).json({
      id: item._id.toString(),
      condition: item.condition,
      date: item.date,
      notes: item.notes,
    });
  } catch (error) {
    console.error("Add medical history error:", error);
    return res.status(500).json({ code: "server_error" });
  }
});

// تعديل تاريخ مرضي
router.put("/history/:id", async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(404).json({ code: "not_found" });
    }

    const condition = String(req.body.condition || "").trim();
    const date = String(req.body.date || "").trim();
    const notes = String(req.body.notes || "").trim();

    if (!condition || condition.length > 200 || notes.length > 1000) {
      return res.status(400).json({ code: "invalid_data" });
    }

    const record = await MedicalRecord.findOne({
      patientId: req.user._id,
    });

    if (!record) {
      return res.status(404).json({ code: "not_found" });
    }

    const item = record.history.id(req.params.id);

    if (!item) {
      return res.status(404).json({ code: "not_found" });
    }

    item.condition = condition;
    item.date = date;
    item.notes = notes;

    await record.save();

    return res.json({
      id: item._id.toString(),
      condition: item.condition,
      date: item.date,
      notes: item.notes,
    });
  } catch (error) {
    console.error("Update medical history error:", error);
    return res.status(500).json({ code: "server_error" });
  }
});

// رفع التقارير الطبية
router.post("/reports", uploadMultiple, async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ code: "invalid_data" });
    }

    const reports = req.files.map((file) => ({
      name: file.originalname,
      fileName: file.filename,
      filePath: `uploads/${file.filename}`,
      fileType: file.mimetype,
      size: file.size,
      uploadedAt: new Date(),
    }));

    const record = await MedicalRecord.findOneAndUpdate(
      { patientId: req.user._id },
      { $push: { reports: { $each: reports } } },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    const savedReports = record.reports.slice(-reports.length);

    return res.status(201).json(
      savedReports.map((item) => ({
        id: item._id.toString(),
        name: item.name,
        date: item.uploadedAt,
        size: item.size,
        type: item.fileType,
        url: `/patient/reports/${item._id}/file`,
      }))
    );
  } catch (error) {
    console.error("Upload medical reports error:", error);
    return res.status(500).json({ code: "server_error" });
  }
});

// عرض تقرير طبي محمي
router.get("/reports/:id/file", async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(404).json({ code: "not_found" });
    }

    const record = await MedicalRecord.findOne({
      patientId: req.user._id,
    });

    const report = record?.reports.id(req.params.id);

    if (!report) {
      return res.status(404).json({ code: "not_found" });
    }

    const uploadsDir = path.resolve(__dirname, "../uploads");
    const filePath = path.resolve(__dirname, "..", report.filePath);

    if (
      !filePath.startsWith(uploadsDir + path.sep) ||
      !fs.existsSync(filePath)
    ) {
      return res.status(404).json({ code: "file_not_found" });
    }

    return res.sendFile(filePath);
  } catch (error) {
    console.error("Get medical report error:", error);
    return res.status(500).json({ code: "server_error" });
  }
});

// حذف تقرير طبي
router.delete("/reports/:id", async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(404).json({ code: "not_found" });
    }

    const record = await MedicalRecord.findOne({
      patientId: req.user._id,
    });

    if (!record) {
      return res.status(404).json({ code: "not_found" });
    }

    const report = record.reports.id(req.params.id);

    if (!report) {
      return res.status(404).json({ code: "not_found" });
    }

    const uploadsDir = path.resolve(__dirname, "../uploads");
    const filePath = path.resolve(__dirname, "..", report.filePath);

    if (filePath.startsWith(uploadsDir + path.sep)) {
      await fs.promises.unlink(filePath).catch((error) => {
        if (error.code !== "ENOENT") throw error;
      });
    }

    report.deleteOne();
    await record.save();

    return res.json({ success: true });
  } catch (error) {
    console.error("Delete medical report error:", error);
    return res.status(500).json({ code: "server_error" });
  }
});

// Get patient prescriptions
router.get("/prescriptions", async (req, res) => {
  try {
    const current = req.query.current === "true";

    const prescriptions = await Prescription.find({
      patientId: req.user._id,
      current,
    })
      .populate("doctorId", "name extra specialty")
      .sort({ date: -1 })
      .lean();

    const data = prescriptions.map((rx) => ({
      id: rx._id.toString(),
      doctor: rx.doctorId?.name || "",
      specialty: specialtyView(rx.doctorId?.specialty || rx.doctorId?.extra),
      visit: rx.visit,
      date: rx.date,
      diagnosis: rx.diagnosis,
      items: rx.items || [],
      tests: rx.tests || [],
      current: rx.current,
    }));

    return res.json(data);
  } catch (error) {
    console.error("Get prescriptions error:", error);
    return res.status(500).json({
      message: "Failed to get prescriptions",
    });
  }
});

// Move prescription between current and past
router.patch("/prescriptions/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { current } = req.body;

    if (!require("mongoose").Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid prescription ID" });
    }

    if (typeof current !== "boolean") {
      return res.status(400).json({ message: "Invalid current value" });
    }

    const prescription = await Prescription.findOneAndUpdate(
      {
        _id: id,
        patientId: req.user._id,
      },
      { current },
      { returnDocument: "after" }
    );

    if (!prescription) {
      return res.status(404).json({
        message: "Prescription not found",
      });
    }

    return res.json({
      message: "Prescription updated successfully",
      id: prescription._id,
      current: prescription.current,
    });
  } catch (error) {
    console.error("Update prescription error:", error);
    return res.status(500).json({
      message: "Failed to update prescription",
    });
  }
});


// 1. عرض الأذونات النشطة
router.get("/permissions/active", async (req, res) => {
  try {
    const grants = await AccessGrant.find({
      patientId: req.user._id,
      status: "active",
      $or: [{ until: null }, { until: { $gt: new Date() } }],
    })
      .populate("doctorId", "name extra specialty")
      .sort({ grantedAt: -1 })
      .lean();

    const data = grants.map((grant) => ({
      id: grant._id.toString(),
      kind: "doctor",
      grantee: grant.doctorId?.name || "",
      scope: grant.scope || "medical_file",
      until: grant.until ? new Date(grant.until).toISOString().slice(0, 10) : null,
    }));

    return res.json(data);
  } catch (error) {
    console.error("Get active permissions error:", error);
    return res.status(500).json({ message: "Failed to get permissions" });
  }
});

// 2. إلغاء إذن واحد
router.delete("/permissions/active/:id", async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid permission ID" });
    }

    const grant = await AccessGrant.findOneAndUpdate(
      {
        _id: id,
        patientId: req.user._id,
        status: "active",
      },
      {
        status: "revoked",
        revokedAt: new Date(),
      },
      { returnDocument: "after" }
    );

    if (!grant) {
      return res.status(404).json({ message: "Permission not found" });
    }

    const revoked = await User.findById(grant.doctorId).select("name");
    logAccess(req.user._id, { _id: grant.doctorId, name: revoked ? revoked.name : "" }, "revoked_access", grant._id);

    return res.json({ message: "Permission revoked successfully" });
  } catch (error) {
    console.error("Revoke permission error:", error);
    return res.status(500).json({ message: "Failed to revoke permission" });
  }
});

// 3. إلغاء كل الأذونات
router.delete("/permissions/active", async (req, res) => {
  try {
    await AccessGrant.updateMany(
      {
        patientId: req.user._id,
        status: "active",
      },
      {
        $set: {
          status: "revoked",
          revokedAt: new Date(),
        },
      }
    );

    return res.json({ message: "All permissions revoked successfully" });
  } catch (error) {
    console.error("Revoke all permissions error:", error);
    return res.status(500).json({ message: "Failed to revoke permissions" });
  }
});

// 4. عرض طلبات الصلاحيات المعلقة
router.get("/permissions/requests", async (req, res) => {
  try {
    const requests = await AccessRequest.find({
      patientId: req.user._id,
      status: "pending",
    })
      .populate("requesterId", "name extra")
      .sort({ createdAt: -1 })
      .lean();

    const data = requests.map((request) => ({
      id: request._id.toString(),
      kind: request.requesterRole,
      requester: request.requesterId?.name || "",
      scope: request.scope,
      date: request.createdAt,
    }));

    return res.json(data);
  } catch (error) {
    console.error("Get permission requests error:", error);
    return res.status(500).json({ message: "Failed to get requests" });
  }
});

// 5. قبول أو رفض طلب صلاحية
router.post("/permissions/requests/:id/:decision", async (req, res) => {
  try {
    const { id, decision } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid request ID" });
    }

    if (!["approve", "reject"].includes(decision)) {
      return res.status(400).json({ message: "Invalid decision" });
    }

    const request = await AccessRequest.findOne({
      _id: id,
      patientId: req.user._id,
      status: "pending",
    });

    if (!request) {
      return res.status(404).json({ message: "Request not found" });
    }

    // AccessGrant الحالي يدعم الطبيب فقط
    if (decision === "approve" && request.requesterRole !== "doctor") {
      return res.status(400).json({
        message: "Lab permissions are not supported by the current grant model",
      });
    }

    if (decision === "approve") {
      await AccessGrant.findOneAndUpdate(
        {
          patientId: req.user._id,
          doctorId: request.requesterId,
        },
        {
          $set: {
            status: "active",
            grantedAt: new Date(),
            revokedAt: null,
          },
          $setOnInsert: {
            patientId: req.user._id,
            doctorId: request.requesterId,
          },
        },
        { upsert: true, returnDocument: "after" }
      );
    }

    request.status = decision === "approve" ? "approved" : "rejected";
    request.decidedAt = new Date();
    await request.save();

    return res.json({
      message: decision === "approve" ? "Request approved" : "Request rejected",
    });
  } catch (error) {
    console.error("Decide permission request error:", error);
    return res.status(500).json({ message: "Failed to decide request" });
  }
});


// سجل الاطلاع على ملف المريض
router.get("/permissions/log", async (req, res) => {
  try {
    const rows = await AccessLog.find({ patientId: req.user._id })
      .sort({ at: -1 })
      .limit(100)
      .lean();

    return res.json(
      rows.map((row) => ({
        id: row._id.toString(),
        who: row.actorName || "",
        action: ACTION_LABELS[row.action],
        at: row.at,
      }))
    );
  } catch (error) {
    console.error("Get access log error:", error);
    return res.status(500).json({
      message: "Failed to get access log",
    });
  }
});



// ===============================
// الملف الشخصي للمريض
// ===============================
function ageFromBirth(birth) {
  if (!birth) return null;
  const b = new Date(birth + "T00:00:00");
  if (Number.isNaN(b.getTime())) return null;
  const n = new Date();
  let a = n.getFullYear() - b.getFullYear();
  if (n.getMonth() < b.getMonth() || (n.getMonth() === b.getMonth() && n.getDate() < b.getDate())) a -= 1;
  return a >= 0 ? a : null;
}


function cleanOther(v) {
  const arr = Array.isArray(v) ? v : String(v || "").split(/[,،;\n]/);
  return arr.map((x) => String(x).trim().slice(0, 60)).filter(Boolean).slice(0, 10);
}

function patientProfileView(user) {
  const p = user.profile || {};
  const ids = (p.chronicIds || []).filter((id) => CHRONIC.some((c) => c.id === id));
  const other = cleanOther(p.chronicOther);
  return {
    birthDate: p.birthDate || "",
    blood: p.blood || "",
    height: p.height || 0,
    weight: p.weight || 0,
    age: ageFromBirth(p.birthDate),
    chronic: [
      ...ids.map((id) => {
        const c = CHRONIC.find((x) => x.id === id);
        return { ar: c.ar, en: c.en };
      }),
      ...other.map((x) => ({ ar: x, en: x })),
    ],
    chronicIds: ids,
    chronicOther: other,
  };
}

router.get("/profile", async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("profile");
    res.json(patientProfileView(user));
  } catch (error) {
    console.error("Get patient profile error:", error);
    res.status(500).json({ code: "server_error" });
  }
});

router.put("/profile", async (req, res) => {
  try {
    const b = req.body || {};
    const set = {};

    if (b.birthDate !== undefined) {
      const ok = /^\d{4}-\d{2}-\d{2}$/.test(String(b.birthDate));
      const d = new Date(b.birthDate);
      if (!ok || Number.isNaN(d.getTime()) || d >= new Date() || d.getFullYear() <= 1900) {
        return res.status(400).json({ code: "invalid_data" });
      }
      set["profile.birthDate"] = b.birthDate;
    }
    if (b.blood !== undefined) set["profile.blood"] = String(b.blood).slice(0, 4);
    if (b.height !== undefined) set["profile.height"] = Number(b.height) || 0;
    if (b.weight !== undefined) set["profile.weight"] = Number(b.weight) || 0;
    if (b.chronicOther !== undefined) {
      set["profile.chronicOther"] = cleanOther(b.chronicOther);
    }
    if (Array.isArray(b.chronicIds)) {
      set["profile.chronicIds"] = b.chronicIds
        .map(String)
        .filter((id) => CHRONIC.some((c) => c.id === id));
    }

    if (Object.keys(set).length) await User.updateOne({ _id: req.user._id }, { $set: set });
    const user = await User.findById(req.user._id).select("profile");
    res.json(patientProfileView(user));
  } catch (error) {
    console.error("Update patient profile error:", error);
    res.status(500).json({ code: "server_error" });
  }
});

// ===============================
// مساعد فرز الأعراض: يفهم الأعراض، ينبّه للطوارئ، يرتب التخصصات ويقترح أطباء من قاعدة البيانات
// (محرك قواعد دائم + نموذج Claude اختياري عند ضبط ANTHROPIC_API_KEY). انظر utils/triage.js
// ===============================
const { triage: runTriage, aiEnabled } = require("../utils/triage");
const { TEST_INFO, labOfferedTests } = require("../data/catalog");
const { norm: normText } = require("../utils/triage");

const triageHits = new Map();

function kmBetween(a, b) {
  const R = 6371;
  const rad = (x) => (x * Math.PI) / 180;
  const dLat = rad(b.lat - a.lat);
  const dLng = rad(b.lng - a.lng);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

router.post("/triage", async (req, res) => {
  try {
    const text = String((req.body && req.body.text) || "").trim().slice(0, 1000);
    if (text.length < 2) return res.status(400).json({ code: "invalid_data" });

    // حد 30 طلب في الساعة لكل مريض (حماية من الإغراق وتكلفة الذكاء الاصطناعي)
    const key = String(req.user._id);
    const now = Date.now();
    const hits = (triageHits.get(key) || []).filter((t) => now - t < 3600 * 1000);
    if (hits.length >= 30) return res.status(429).json({ code: "too_many_requests" });
    hits.push(now);
    triageHits.set(key, hits);

    // سياق المريض: العمر والأمراض المزمنة (من ملفه الصحي)
    const profile = req.user.profile || {};
    let age = null;
    if (profile.birthDate) {
      const birth = new Date(profile.birthDate);
      if (!Number.isNaN(birth.getTime())) {
        age = Math.floor((now - birth.getTime()) / (365.25 * 24 * 3600 * 1000));
      }
    }
    const chronic = (Array.isArray(profile.chronicIds) ? profile.chronicIds : [])
      .map((id) => (CHRONIC.find((c) => c.id === id) || {}).en)
      .filter(Boolean)
      .concat(cleanOther(profile.chronicOther));

    const result = await runTriage(text, { age, chronic });

    // موقع المريض (اختياري) لترتيب الأطباء بالأقرب
    const near =
      req.body.near && Number.isFinite(Number(req.body.near.lat)) && Number.isFinite(Number(req.body.near.lng))
        ? { lat: Number(req.body.near.lat), lng: Number(req.body.near.lng) }
        : null;

    // أطباء كل تخصص مقترح (حتى 3 لكل تخصص)
    const doctors = [];
    const seen = new Set();
    for (const spec of result.specialties) {
      const docs = await User.find({
        role: "doctor",
        status: "active",
        $or: [{ specialty: spec.id }, { extra: spec.id }],
      })
        .select("name specialty extra address clinic location")
        .limit(30);

      const rows = docs
        .filter((u) => !seen.has(String(u._id)))
        .map((u) => {
          const hasLoc = u.location && Number.isFinite(u.location.lat) && Number.isFinite(u.location.lng);
          return {
            id: u._id.toString(),
            type: "doctor",
            name: { ar: u.name, en: u.name },
            specialty: specialtyView(u.specialty || u.extra) || { ar: "طبيب", en: "Doctor" },
            clinic: u.clinic || "",
            address: u.address ? { ar: u.address, en: u.address } : { ar: "غير محدد", en: "Not specified" },
            city: { ar: "غير محدد", en: "Not specified" },
            lat: hasLoc ? u.location.lat : null,
            lng: hasLoc ? u.location.lng : null,
            rating: 0,
            x: 50,
            y: 50,
            matchedSpecialty: spec.id,
            distanceKm: near && hasLoc ? Math.round(kmBetween(near, u.location) * 10) / 10 : null,
          };
        });

      if (near) {
        rows.sort((a, b) => (a.distanceKm ?? 1e9) - (b.distanceKm ?? 1e9));
      }
      rows.slice(0, 3).forEach((r) => {
        seen.add(r.id);
        doctors.push(r);
      });
    }

    // الفحوصات المقترحة + المعامل التي توفر كل فحص (حسب ما فعّله كل معمل في ملفه)
    const tests = [];
    if (!result.emergency && result.tests && result.tests.length) {
      const labs = await User.find({ role: "lab", status: "active" })
        .select("name address location labProfile")
        .limit(300);
      const labRows = labs.map((u) => {
        const hasLoc = u.location && Number.isFinite(u.location.lat) && Number.isFinite(u.location.lng);
        return {
          u,
          offered: labOfferedTests(u).map(normText),
          hasLoc,
        };
      });

      for (const name of result.tests) {
        const info = TEST_INFO.find((t) => t.ar === name);
        if (!info) continue;
        const keys = [normText(info.ar), normText(info.en)];
        const offers = (n) => keys.includes(n) || (n.length >= 4 && keys.some((k) => k.includes(n) || n.includes(k)));
        const rows = labRows
          .filter((l) => l.offered.some(offers))
          .map(({ u, hasLoc }) => ({
            id: u._id.toString(),
            type: "lab",
            name: { ar: u.name, en: u.name },
            specialty: { ar: "معمل تحاليل", en: "Medical Lab" },
            address: u.address ? { ar: u.address, en: u.address } : { ar: "غير محدد", en: "Not specified" },
            city: { ar: "غير محدد", en: "Not specified" },
            lat: hasLoc ? u.location.lat : null,
            lng: hasLoc ? u.location.lng : null,
            rating: 0,
            x: 50,
            y: 50,
            distanceKm: near && hasLoc ? Math.round(kmBetween(near, u.location) * 10) / 10 : null,
          }));
        if (near) rows.sort((a, b) => (a.distanceKm ?? 1e9) - (b.distanceKm ?? 1e9));
        tests.push({ ar: info.ar, en: info.en, kind: info.kind, labs: rows.slice(0, 3), labCount: rows.length });
      }
    }

    res.json({
      tests,
      severity: result.severity,
      emergency: result.emergency,
      summary: result.summary,
      specialties: result.specialties,
      questions: result.questions,
      advice: result.advice,
      doctors,
      source: result.source,
      aiEnabled: aiEnabled(),
    });
  } catch (error) {
    console.error("Triage error:", error);
    res.status(500).json({ code: "server_error" });
  }
});

module.exports = router;
