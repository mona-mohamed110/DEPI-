
const express = require("express");
const mongoose = require("mongoose");

const LabRequest = require("../models/LabRequest");
const LabResult = require("../models/LabResult");
const Booking = require("../models/Booking");
const User = require("../models/User");

const { requireAuth, requireRole } = require("../middleware/auth");
const { uploadMultiple } = require("../middleware/upload");

const router = express.Router();

router.use(requireAuth, requireRole("lab"));

// تجهيز شكل الطلب للواجهة
function requestRow(item) {
  return {
    id: item._id.toString(),
    patientId: item.patientId?.toString() || null,
    bookingId: item.bookingId?.toString() || null,
    name: item.name,
    sex: item.sex,
    age: item.age,
    phone: item.phone,
    test: item.test,
    kind: item.kind,
    doctor: item.doctor,
    status: item.status,
    files: item.files || [],
    notes: item.notes || "",
    createdAt: item.createdAt,
    uploadedAt: item.uploadedAt,
  };
}

// عرض طلبات المعمل
router.get("/requests", async (req, res) => {
  try {
    const filter = { labId: req.user._id };

    if (req.query.status === "pending") {
      filter.status = { $ne: "done" };
    } else if (["new", "progress", "done"].includes(req.query.status)) {
      filter.status = req.query.status;
    }

    const requests = await LabRequest.find(filter).sort({ createdAt: -1 });

    return res.json(requests.map(requestRow));
  } catch (error) {
    console.error("Get lab requests error:", error);
    return res.status(500).json({ code: "server_error" });
  }
});

// إنشاء طلب تحليل جديد
router.post("/requests", async (req, res) => {
  try {
    const { name, sex, age, phone, test, kind } = req.body;

    const parsedAge = Number(age);
    const cleanPhone = String(phone || "").trim();

    if (
      !name ||
      String(name).trim().length < 3 ||
      !Number.isInteger(parsedAge) ||
      parsedAge < 0 ||
      parsedAge > 120 ||
      !cleanPhone ||
      !test
    ) {
      return res.status(400).json({ code: "invalid_data" });
    }

    const patient = await User.findOne({
      role: "patient",
      phone: cleanPhone,
    });

    const request = await LabRequest.create({
      labId: req.user._id,
      patientId: patient?._id || null,
      name: String(name).trim(),
      sex: sex === "female" ? "female" : "male",
      age: parsedAge,
      phone: cleanPhone,
      test: String(test).trim(),
      kind: kind === "xray" ? "xray" : "lab",
      status: "new",
    });

    return res.status(201).json(requestRow(request));
  } catch (error) {
    console.error("Create lab request error:", error);
    return res.status(500).json({ code: "server_error" });
  }
});

// بدء تنفيذ الطلب
router.patch("/requests/:id/start", async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(404).json({ code: "not_found" });
    }

    const request = await LabRequest.findOne({
      _id: req.params.id,
      labId: req.user._id,
    });

    if (!request) {
      return res.status(404).json({ code: "not_found" });
    }

    if (request.status === "done") {
      return res.status(400).json({ code: "already_completed" });
    }

    request.status = "progress";
    await request.save();

    if (request.bookingId) {
      await Booking.updateOne(
        {
          _id: request.bookingId,
          providerId: req.user._id,
          kind: "lab",
        },
        { status: "confirmed" }
      );
    }

    return res.json(requestRow(request));
  } catch (error) {
    console.error("Start lab request error:", error);
    return res.status(500).json({ code: "server_error" });
  }
});

// رفع نتيجة التحليل
router.post(
  "/requests/:id/result",
  uploadMultiple,
  async (req, res) => {
    try {
      if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
        return res.status(404).json({ code: "not_found" });
      }

      const request = await LabRequest.findOne({
        _id: req.params.id,
        labId: req.user._id,
      });

      if (!request) {
        return res.status(404).json({ code: "not_found" });
      }

      if (request.status === "done") {
        return res.status(400).json({ code: "already_completed" });
      }

      if (!req.files || req.files.length === 0) {
        return res.status(400).json({ code: "invalid_data" });
      }



      const uploadedAt = new Date();

      const resultDocuments = req.files.map((file) => ({
        patientId: request.patientId,
        labId: req.user._id,
        bookingId: request.bookingId,
        fileName: file.originalname,
        filePath: `uploads/${file.filename}`,
        fileType: file.mimetype,
      }));

      if (request.patientId) {
  await LabResult.insertMany(resultDocuments);
}

      request.status = "done";
      request.files = req.files.map((file) => file.originalname);
      request.notes = String(req.body.notes || "").trim();
      request.uploadedAt = uploadedAt;

      await request.save();

      if (request.bookingId) {
        await Booking.updateOne(
          {
            _id: request.bookingId,
            providerId: req.user._id,
            kind: "lab",
          },
          { status: "done" }
        );
      }

      return res.json(requestRow(request));
    } catch (error) {
      console.error("Upload lab result error:", error);
      return res.status(500).json({ code: "server_error" });
    }
  }
);

// عرض النتائج المرفوعة
router.get("/results", async (req, res) => {
  try {
    const filter = {
      labId: req.user._id,
      status: "done",
    };

    if (req.query.name) {
      filter.$or = [
        { name: { $regex: req.query.name, $options: "i" } },
        { test: { $regex: req.query.name, $options: "i" } },
      ];
    }

    if (req.query.date) {
      const start = new Date(`${req.query.date}T00:00:00`);
      const end = new Date(`${req.query.date}T23:59:59.999`);

      filter.uploadedAt = { $gte: start, $lte: end };
    }

    const results = await LabRequest.find(filter).sort({
      uploadedAt: -1,
    });

    return res.json(results.map(requestRow));
  } catch (error) {
    console.error("Get lab results error:", error);
    return res.status(500).json({ code: "server_error" });
  }
});

// تواريخ النتائج المتاحة
router.get("/results/dates", async (req, res) => {
  try {
    const dates = await LabRequest.aggregate([
      {
        $match: {
          labId: req.user._id,
          status: "done",
          uploadedAt: { $ne: null },
        },
      },
      {
        $group: {
          _id: {
            $dateToString: {
              format: "%Y-%m-%d",
              date: "$uploadedAt",
            },
          },
        },
      },
      { $sort: { _id: -1 } },
    ]);

    return res.json(dates.map((item) => item._id));
  } catch (error) {
    console.error("Get result dates error:", error);
    return res.status(500).json({ code: "server_error" });
  }
});

module.exports = router;
