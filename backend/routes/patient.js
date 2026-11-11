
const express = require("express");
const mongoose = require("mongoose");
const fs = require("fs");
const path = require("path");
const Prescription = require("../models/Prescription");
const AccessGrant = require("../models/AccessGrant");
const AccessRequest = require("../models/AccessRequest");
const Booking = require("../models/Booking");
const User = require("../models/User");
const MedicalRecord = require("../models/MedicalRecord");
const { uploadMultiple } = require("../middleware/upload");
const LabRequest = require("../models/LabRequest");
const LabResult = require("../models/LabResult");

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
    specialty: booking.providerId?.extra || "",
    date: booking.date,
    time: booking.time,
    status: booking.status,
    test: booking.test || "",
    queue: booking.queue,
  };
}

// عرض حجوزات المريض
router.get("/appointments", async (req, res) => {
  try {
    const bookings = await Booking.find({
      patientId: req.user._id,
    })
      .populate("providerId", "name extra")
      .sort({ date: 1, time: 1 });

    return res.json(bookings.map(bookingRow));
  } catch (error) {
    console.error("Get patient appointments error:", error);
    return res.status(500).json({ code: "server_error" });
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
      .populate("providerId", "name extra");

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
      .populate("providerId", "name extra");

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

    // تاريخ اليوم بالتوقيت المحلي للسيرفر
    const now = new Date();
    const today = [
      now.getFullYear(),
      String(now.getMonth() + 1).padStart(2, "0"),
      String(now.getDate()).padStart(2, "0"),
    ].join("-");

    const [bookings, results, permCount] = await Promise.all([
      Booking.find({
        patientId,
        date: { $gte: today },
        status: { $in: ["pending", "confirmed"] },
      })
        .populate("providerId", "name extra")
        .sort({ date: 1, time: 1 })
        .limit(5),

      LabResult.find({ patientId })
        .sort({ createdAt: -1 })
        .limit(5),

      AccessRequest.countDocuments({
        patientId,
        status: "pending",
      }),
    ]);

    const next = bookings[0] || null;

    return res.json({
      next: next
        ? {
            date: next.date,
            time: next.time,
          }
        : null,

      // لا يوجد نظام روشتات حتى الآن
      rxCount: 0,
      latestRx: null,

      permCount,

      upcoming: bookings.map((booking) => ({
        id: booking._id.toString(),
        doctor: booking.providerId?.name || "مقدم الخدمة",
        specialty: booking.providerId?.extra || "",
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
        kind: "lab",
        title: item.fileName,
        source: item.labId?.name || "المعمل",
        date: item.createdAt,
        status: "normal",
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

      chronic: profile.chronicIds || [],

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
      .populate("doctorId", "name extra")
      .sort({ date: -1 })
      .lean();

    const data = prescriptions.map((rx) => ({
      id: rx._id.toString(),
      doctor: rx.doctorId?.name || "",
      specialty: rx.doctorId?.extra || "",
      visit: rx.visit,
      date: rx.date,
      diagnosis: rx.diagnosis,
      items: rx.items,
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
    })
      .populate("doctorId", "name extra")
      .sort({ grantedAt: -1 })
      .lean();

    const data = grants.map((grant) => ({
      id: grant._id.toString(),
      kind: "doctor",
      grantee: grant.doctorId?.name || "",
      scope: "medical_file",
      until: null,
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


// Access log - waiting for actual access tracking
router.get("/permissions/log", async (req, res) => {
  try {
    return res.json([]);
  } catch (error) {
    console.error("Get access log error:", error);
    return res.status(500).json({
      message: "Failed to get access log",
    });
  }
});


module.exports = router;
