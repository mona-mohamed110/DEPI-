
const express = require("express");
const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");
const LabResult = require("../models/LabResult");
const Booking = require("../models/Booking");
const AccessRequest = require("../models/AccessRequest");
const User = require("../models/User");
const ApiRequestStat = require("../models/ApiRequestStat");
const AccessGrant = require("../models/AccessGrant");
const { getDateKey } = require("../middleware/apiStats");
const { requireAuth, requireRole } = require("../middleware/auth");

const router = express.Router();

router.use(requireAuth, requireRole("admin"));

const uploadsDir = path.resolve(__dirname, "..", "uploads");

// عدد أخطاء Endpoint المراقبة منذ تشغيل السيرفر
let monitoringErrors = 0;

// تحويل بيانات المستخدم لشكل الـ Frontend
function accountRow(user) {
  return {
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    role: user.role,
    active: user.status !== "disabled",
  };
}

// تجهيز بيانات ملف الشهادة للمعاينة
function getCertificate(user) {
  if (!user.certificate) return null;

  const filePath = path.resolve(__dirname, "..", user.certificate);

  if (!filePath.startsWith(uploadsDir + path.sep)) return null;
  if (!fs.existsSync(filePath)) return null;

  const buffer = fs.readFileSync(filePath);
  const type = user.certificateType || "application/octet-stream";

  return {
    name: user.certificateName || path.basename(filePath),
    type,
    dataUrl: `data:${type};base64,${buffer.toString("base64")}`,
  };
}

// =====================================
// 1. Monitoring
// =====================================
router.get("/monitoring", async (req, res) => {
  const startTime = process.hrtime.bigint();

  try {
    const users = await User.find({
      role: { $ne: "admin" },
    }).select("role status certificate createdAt lastActiveAt");

    const countRole = (role) =>
      users.filter((user) => user.role === role).length;

    const now = new Date();

    // حساب المستخدمين النشطين خلال آخر 5 دقائق
    const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);

    const online = users.filter((user) => {
      return (
        user.status === "active" &&
        user.lastActiveAt &&
        new Date(user.lastActiveAt) >= fiveMinutesAgo
      );
    }).length;

    // بداية الأسبوع: السبت
    const weekStart = new Date(now);
    weekStart.setHours(0, 0, 0, 0);
    weekStart.setDate(
      now.getDate() - ((now.getDay() + 1) % 7)
    );

    // نهاية الأسبوع: الجمعة
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);

    // جلب إحصائيات الطلبات من MongoDB
    const requestStats = await ApiRequestStat.find({
      date: {
        $gte: getDateKey(weekStart),
        $lte: getDateKey(weekEnd),
      },
    }).select("date count");

    const requestsByDate = new Map(
      requestStats.map((item) => [item.date, item.count])
    );

    // ترتيب البيانات: السبت إلى الجمعة
    const weekly = Array.from({ length: 7 }, (_, index) => {
      const date = new Date(weekStart);
      date.setDate(weekStart.getDate() + index);

      return requestsByDate.get(getDateKey(date)) || 0;
    });

    // حساب الحسابات الجديدة خلال آخر 30 يوم
    const thirtyDaysAgo = new Date(now);
    thirtyDaysAgo.setDate(now.getDate() - 30);

    const newAccounts = users.filter(
      (user) =>
        user.createdAt &&
        new Date(user.createdAt) >= thirtyDaysAgo
    ).length;

    // حساب الحجوزات وطلبات إذن الوصول من MongoDB
const [booked, access, uploaded] = await Promise.all([
  Booking.countDocuments({
    status: { $nin: ["cancelled", "rejected"] },
  }),

  AccessGrant.countDocuments({
    status: "active",
  }),

  LabResult.countDocuments(),
]);

    // قياس زمن تنفيذ طلب المراقبة بالمللي ثانية
    const latency =
      Number(process.hrtime.bigint() - startTime) / 1_000_000;

    // مدة تشغيل السيرفر بالثواني
    const uptime = Math.floor(process.uptime());

    return res.json({
      online,
      latency: Number(latency.toFixed(2)),
      errors: monitoringErrors,
      uptime,

      usersByRole: {
        patient: countRole("patient"),
        doctor: countRole("doctor"),
        lab: countRole("lab"),
        reception: countRole("reception"),
      },

      weekly,

report: {
  booked,
  access,
  uploaded,
  newAccounts,
},

      services: [
        { key: "api", ok: true },
        { key: "db", ok: mongoose.connection.readyState === 1 },
        { key: "files", ok: fs.existsSync(uploadsDir) },
      ],
    });
  } catch (error) {
    monitoringErrors++;

    console.error("Admin monitoring error:", error);

    return res.status(500).json({
      code: "server_error",
      message: "حدث خطأ أثناء تحميل بيانات المراقبة",
    });
  }
});

// =====================================
// 2. Get Licenses
// =====================================
router.get("/licenses", async (req, res) => {
  try {
    const users = await User.find({
      role: { $in: ["doctor", "lab"] },
    }).sort({ licenseSentAt: -1, _id: -1 });

    const licenses = users.map((user) => ({
      id: user._id.toString(),
      userId: user._id.toString(),
      name: user.name,
      type: user.role === "doctor" ? "dr" : "lab",
      number: user.license || "—",
      by:
        user.licenseBy ||
        (user.role === "doctor" ? "syndicate" : "ministry"),
      sentAt: user.licenseSentAt
        ? new Date(user.licenseSentAt).toISOString()
        : user.createdAt
          ? new Date(user.createdAt).toISOString()
          : "",
      status: user.licenseStatus || "pend",
      reason: user.licenseReason || "",
      file: getCertificate(user),
    }));

    return res.json(licenses);
  } catch (error) {
    console.error("Admin licenses error:", error);

    return res.status(500).json({
      code: "server_error",
      message: "حدث خطأ أثناء تحميل التراخيص",
    });
  }
});

// =====================================
// 3. Approve License
// =====================================
router.post("/licenses/:id/approve", async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(404).json({ code: "not_found" });
    }

    const user = await User.findOne({
      _id: req.params.id,
      role: { $in: ["doctor", "lab"] },
    });

    if (!user) {
      return res.status(404).json({ code: "not_found" });
    }

    user.licenseStatus = "ok";
    user.licenseReason = "";

    if (user.status === "pending") {
      user.status = "active";
    }

    await user.save();

    const license = {
      id: user._id.toString(),
      userId: user._id.toString(),
      name: user.name,
      type: user.role === "doctor" ? "dr" : "lab",
      number: user.license || "—",
      by:
        user.licenseBy ||
        (user.role === "doctor" ? "syndicate" : "ministry"),
      sentAt: user.licenseSentAt
        ? new Date(user.licenseSentAt).toISOString()
        : "",
      status: user.licenseStatus,
      reason: user.licenseReason,
      file: getCertificate(user),
    };

    return res.json(license);
  } catch (error) {
    console.error("Approve license error:", error);
    return res.status(500).json({ code: "server_error" });
  }
});

// =====================================
// 4. Reject License
// =====================================
router.post("/licenses/:id/reject", async (req, res) => {
  try {
    const reason =
      typeof req.body.reason === "string"
        ? req.body.reason.trim()
        : "";

    if (reason.length < 2) {
      return res.status(400).json({ code: "invalid_data" });
    }

    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(404).json({ code: "not_found" });
    }

    const user = await User.findOne({
      _id: req.params.id,
      role: { $in: ["doctor", "lab"] },
    });

    if (!user) {
      return res.status(404).json({ code: "not_found" });
    }

    user.licenseStatus = "no";
    user.licenseReason = reason.slice(0, 200);

    await user.save();

    return res.json({
      id: user._id.toString(),
      userId: user._id.toString(),
      name: user.name,
      type: user.role === "doctor" ? "dr" : "lab",
      number: user.license || "—",
      by:
        user.licenseBy ||
        (user.role === "doctor" ? "syndicate" : "ministry"),
      sentAt: user.licenseSentAt
        ? new Date(user.licenseSentAt).toISOString()
        : "",
      status: user.licenseStatus,
      reason: user.licenseReason,
      file: getCertificate(user),
    });
  } catch (error) {
    console.error("Reject license error:", error);
    return res.status(500).json({ code: "server_error" });
  }
});

// =====================================
// 5. Get Accounts
// =====================================
router.get("/accounts", async (req, res) => {
  try {
    const users = await User.find({
      role: { $ne: "admin" },
    })
      .select("name email role status")
      .sort({ _id: -1 });

    return res.json(users.map(accountRow));
  } catch (error) {
    console.error("Admin accounts error:", error);
    return res.status(500).json({ code: "server_error" });
  }
});

// =====================================
// 6. Activate / Disable Account
// =====================================
router.patch("/accounts/:id", async (req, res) => {
  try {
    if (typeof req.body.active !== "boolean") {
      return res.status(400).json({ code: "invalid_data" });
    }

    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(404).json({ code: "not_found" });
    }

    const user = await User.findById(req.params.id);

    if (!user || user.role === "admin") {
      return res.status(404).json({ code: "not_found" });
    }

    user.status = req.body.active ? "active" : "disabled";

    await user.save();

    return res.json(accountRow(user));
  } catch (error) {
    console.error("Update account error:", error);
    return res.status(500).json({ code: "server_error" });
  }
});

module.exports = router;
