
const express = require("express");
const mongoose = require("mongoose");

const LabRequest = require("../models/LabRequest");
const LabResult = require("../models/LabResult");
const Booking = require("../models/Booking");
const User = require("../models/User");
const { TEST_CATALOG } = require("../data/catalog");

const { logAccess } = require("../utils/accessLog");
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
        requestId: request._id,
        title: request.test,
        kind: ["lab", "xray", "ecg", "other"].includes(request.kind) ? request.kind : "lab",
        status: ["normal", "low", "high", "followup"].includes(req.body.status) ? req.body.status : "normal",
        fileName: file.originalname,
        filePath: `uploads/${file.filename}`,
        fileType: file.mimetype,
      }));

      if (request.patientId) {
  await LabResult.insertMany(resultDocuments);
  logAccess(request.patientId, req.user, "uploaded_result", request._id);
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

function labProfileView(user) {
  const lp = user.labProfile || {};
  return {
    license: user.license || "",
    address: user.address || "",
    phone: lp.phone || user.phone || "",
    hours: lp.hours && lp.hours.length === 7 ? lp.hours : Array.from({ length: 7 }, (_, i) => ({ on: i < 6, from: "08:00", to: "20:00" })),
    tests: lp.tests && lp.tests.length ? lp.tests : TEST_CATALOG.map((name) => ({ name, on: true })),
  };
}

router.get("/profile", async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    res.json(labProfileView(user));
  } catch (error) {
    console.error("Get lab profile error:", error);
    res.status(500).json({ code: "server_error" });
  }
});

router.put("/profile", async (req, res) => {
  try {
    const b = req.body || {};
    const set = {};
    if (b.address !== undefined) set.address = String(b.address).trim().slice(0, 150);
    if (b.phone !== undefined) set["labProfile.phone"] = String(b.phone).trim().slice(0, 20);
    if (b.hours !== undefined) {
      const hours = cleanDays(b.hours);
      if (!hours) return res.status(400).json({ code: "invalid_data" });
      set["labProfile.hours"] = hours;
    }
    if (b.tests !== undefined) {
      if (!Array.isArray(b.tests) || b.tests.length > 200) return res.status(400).json({ code: "invalid_data" });
      set["labProfile.tests"] = b.tests
        .map((t) => ({ name: String((t && t.name) || "").trim().slice(0, 80), on: !!(t && t.on) }))
        .filter((t) => t.name);
    }
    if (Object.keys(set).length) await User.updateOne({ _id: req.user._id }, { $set: set });
    const user = await User.findById(req.user._id);
    res.json(labProfileView(user));
  } catch (error) {
    console.error("Update lab profile error:", error);
    res.status(500).json({ code: "server_error" });
  }
});

module.exports = router;
