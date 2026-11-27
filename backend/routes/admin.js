
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
const ContactMessage = require("../models/ContactMessage");
const sendEmail = require("../utils/sendEmail");
const { getDateKey } = require("../middleware/apiStats");
const bcrypt = require("bcrypt");
const multer = require("multer");
const Review = require("../models/Review");
const SiteSettings = require("../models/SiteSettings");
const EmailDesign = require("../models/EmailDesign");
const AdminLog = require("../models/AdminLog");
const { logAdmin } = require("../utils/adminLog");
const { requireAuth, requireRole } = require("../middleware/auth");

const router = express.Router();

router.use(requireAuth, requireRole("admin"));

// ===== صلاحيات الصفحات للأدمن الفرعي =====
const PAGES = ["monitoring", "licenses", "accounts", "messages", "reviews"];
const needPage = (key) => (req, res, next) => {
  if (!req.user.subAdmin || (req.user.adminPerms || []).includes(key)) return next();
  return res.status(403).json({ code: "no_page_access" });
};
const superOnly = (req, res, next) => {
  if (req.user.subAdmin) return res.status(403).json({ code: "no_page_access" });
  next();
};
router.use("/monitoring", needPage("monitoring"));
router.use("/licenses", needPage("licenses"));
router.use("/accounts", needPage("accounts"));
router.use("/messages", needPage("messages"));
router.use("/reviews", needPage("reviews"));

// صلاحيات المستخدم الحالي (للقائمة الجانبية)
router.get("/access", (req, res) => {
  const sub = !!req.user.subAdmin;
  res.json({ sub, perms: sub ? (req.user.adminPerms || []).filter((p) => PAGES.includes(p)) : PAGES });
});

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
    // الحساب المعلّق (pending) لا يستطيع الدخول، فلا يُعرض كمفعّل
    active: user.status === "active",
    pending: user.status === "pending",
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

    await logAdmin(req, "license_approve", user.name, user.role);
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
    await logAdmin(req, "license_reject", user.name, user.licenseReason);

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
    await logAdmin(req, req.body.active ? "account_enable" : "account_disable", user.name, user.role);

    return res.json(accountRow(user));
  } catch (error) {
    console.error("Update account error:", error);
    return res.status(500).json({ code: "server_error" });
  }
});

// =====================================
// رسائل وشكاوى واقتراحات المستخدمين والزوار + الرد عليها
// =====================================
function msgRow(m, full) {
  const row = {
    id: String(m._id),
    kind: m.kind,
    subject: m.subject,
    preview: String(m.message || "").slice(0, 120),
    name: m.name,
    email: m.email,
    phone: m.phone,
    role: m.role || "visitor",
    registered: !!m.userId,
    status: m.status,
    unread: !!m.adminUnread,
    replyCount: (m.replies || []).length,
    createdAt: m.createdAt,
    updatedAt: m.updatedAt,
  };
  if (full) {
    row.message = m.message;
    row.replies = (m.replies || []).map((r) => ({
      id: String(r._id),
      from: r.from,
      text: r.text,
      byName: r.byName,
      emailed: !!r.emailed,
      at: r.at,
    }));
  }
  return row;
}

router.get("/messages", async (req, res) => {
  try {
    const filter = {};
    if (["new", "replied", "closed"].includes(req.query.status)) filter.status = req.query.status;
    if (["message", "complaint", "suggestion"].includes(req.query.kind)) filter.kind = req.query.kind;
    if (["visitor", "patient", "doctor", "lab", "reception"].includes(req.query.role)) filter.role = req.query.role;

    const list = await ContactMessage.find(filter).sort({ updatedAt: -1 }).limit(300);
    const unread = await ContactMessage.countDocuments({ adminUnread: true });
    res.json({ unread, items: list.map((m) => msgRow(m, false)) });
  } catch (error) {
    console.error("Admin messages error:", error);
    res.status(500).json({ code: "server_error" });
  }
});

router.get("/messages/unread", async (req, res) => {
  try {
    res.json({ count: await ContactMessage.countDocuments({ adminUnread: true }) });
  } catch (error) {
    res.status(500).json({ code: "server_error" });
  }
});

router.get("/messages/:id", async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(404).json({ code: "not_found" });
    const m = await ContactMessage.findById(req.params.id);
    if (!m) return res.status(404).json({ code: "not_found" });
    if (m.adminUnread) {
      m.adminUnread = false;
      m.read = true;
      await m.save();
    }
    res.json(msgRow(m, true));
  } catch (error) {
    console.error("Admin message error:", error);
    res.status(500).json({ code: "server_error" });
  }
});

// رد الإدارة: يظهر في صفحة المستخدم المسجل، ويُرسل على البريد للزائر (وكذلك للمسجل إن كان البريد مضبوطاً)
router.post("/messages/:id/reply", async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(404).json({ code: "not_found" });
    const m = await ContactMessage.findById(req.params.id);
    if (!m) return res.status(404).json({ code: "not_found" });

    const text = String((req.body && req.body.text) || "").trim();
    if (text.length < 2) return res.status(400).json({ code: "invalid_data" });
    if (m.replies.length >= 100) return res.status(429).json({ code: "too_many_requests" });

    let emailed = false;
    try {
      await sendEmail(
        m.email,
        "Shefaa - رد من الإدارة" + (m.subject ? ": " + m.subject : ""),
        text + "\n\n---\nرسالتك: " + String(m.message).slice(0, 300)
      );
      emailed = true;
    } catch (mailError) {
      // الزائر بلا حساب لا يستطيع رؤية الرد إلا بالبريد، فنخبر الأدمن إن لم يُرسل
      if (!m.userId) {
        console.error("Admin reply email error:", mailError.message || mailError);
        return res.status(502).json({ code: "email_failed" });
      }
    }

    m.replies.push({ from: "admin", text: text.slice(0, 2000), byName: req.user.name, emailed });
    m.status = "replied";
    m.adminUnread = false;
    m.userUnread = true;
    await m.save();
    await logAdmin(req, "message_reply", m.subject || m.name, m.email);
    res.json(msgRow(m, true));
  } catch (error) {
    console.error("Admin reply error:", error);
    res.status(500).json({ code: "server_error" });
  }
});

router.patch("/messages/:id", async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(404).json({ code: "not_found" });
    const status = req.body && req.body.status;
    if (!["new", "replied", "closed"].includes(status)) return res.status(400).json({ code: "invalid_data" });
    const m = await ContactMessage.findByIdAndUpdate(req.params.id, { $set: { status } }, { new: true });
    if (!m) return res.status(404).json({ code: "not_found" });
    await logAdmin(req, "message_status", m.subject || m.name, status);
    res.json(msgRow(m, true));
  } catch (error) {
    res.status(500).json({ code: "server_error" });
  }
});

router.delete("/messages/:id", async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(404).json({ code: "not_found" });
    const old = await ContactMessage.findByIdAndDelete(req.params.id);
    if (old) await logAdmin(req, "message_delete", old.subject || old.name, old.email);
    res.json({ ok: true });
  } catch (error) {
    res.status(500).json({ code: "server_error" });
  }
});

// =====================================
// التقييمات: مراجعة واعتماد/رفض وحذف + اختيار ٤ تقييمات للمنصة للصفحة الرئيسية
// =====================================
const reviewRow = (r) => ({
  id: String(r._id), type: r.type, authorName: r.authorName, authorRole: r.authorRole,
  targetName: r.targetName, targetRole: r.targetRole, rating: r.rating, comment: r.comment,
  status: r.status, featured: !!r.featured, createdAt: r.createdAt,
});
const MAX_FEATURED = 4;

router.get("/reviews", async (req, res) => {
  try {
    const q = {};
    if (["platform", "provider"].includes(req.query.type)) q.type = req.query.type;
    if (["doctor", "lab"].includes(req.query.role)) q.targetRole = req.query.role;
    if (["pending", "approved", "rejected"].includes(req.query.status)) q.status = req.query.status;
    const [list, pending, featured] = await Promise.all([
      Review.find(q).sort({ createdAt: -1 }).limit(300),
      Review.countDocuments({ status: "pending" }),
      Review.countDocuments({ featured: true }),
    ]);
    res.json({ items: list.map(reviewRow), pending, featured, maxFeatured: MAX_FEATURED });
  } catch (e) {
    res.status(500).json({ code: "server_error" });
  }
});

// إظهار/إخفاء قسم الآراء في الصفحة الرئيسية
router.get("/reviews/settings", async (req, res) => {
  try {
    const s = await SiteSettings.findOne({ key: "site" }).lean();
    res.json({ showTestimonials: s ? s.showTestimonials !== false : true });
  } catch (e) {
    res.status(500).json({ code: "server_error" });
  }
});

router.put("/reviews/settings", async (req, res) => {
  try {
    if (typeof (req.body || {}).showTestimonials !== "boolean") return res.status(400).json({ code: "invalid_data" });
    const show = req.body.showTestimonials;
    await SiteSettings.findOneAndUpdate({ key: "site" }, { $set: { showTestimonials: show }, $setOnInsert: { key: "site" } }, { upsert: true });
    await logAdmin(req, show ? "review_section_show" : "review_section_hide", "", "");
    res.json({ showTestimonials: show });
  } catch (e) {
    res.status(500).json({ code: "server_error" });
  }
});

router.patch("/reviews/:id", async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(404).json({ code: "not_found" });
    const r = await Review.findById(req.params.id);
    if (!r) return res.status(404).json({ code: "not_found" });
    const b = req.body || {};
    let action = null;
    if (b.status !== undefined) {
      if (!["pending", "approved", "rejected"].includes(b.status)) return res.status(400).json({ code: "invalid_data" });
      if (b.status !== r.status) action = b.status === "approved" ? "review_approve" : b.status === "rejected" ? "review_reject" : "review_pending";
      r.status = b.status;
      if (r.status !== "approved") r.featured = false;
    }
    if (typeof b.featured === "boolean" && b.featured !== r.featured) {
      if (b.featured) {
        if (r.type !== "platform" || r.status !== "approved") return res.status(400).json({ code: "review_not_featurable" });
        if ((await Review.countDocuments({ featured: true, _id: { $ne: r._id } })) >= MAX_FEATURED) return res.status(400).json({ code: "featured_limit" });
      }
      r.featured = b.featured;
      action = b.featured ? "review_feature" : "review_unfeature";
    }
    await r.save();
    if (action) await logAdmin(req, action, r.type === "platform" ? r.authorName : r.targetName, `${r.rating}/5`);
    res.json(reviewRow(r));
  } catch (e) {
    console.error("Review update error:", e);
    res.status(500).json({ code: "server_error" });
  }
});

router.delete("/reviews/:id", async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(404).json({ code: "not_found" });
    const r = await Review.findByIdAndDelete(req.params.id);
    if (r) await logAdmin(req, "review_delete", r.type === "platform" ? r.authorName : r.targetName, `${r.rating}/5`);
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ code: "server_error" });
  }
});

// =====================================
// مستخدمو لوحة التحكم + سجل النشاط (للأدمن الرئيسي فقط)
// =====================================
function subRow(u) {
  return {
    id: String(u._id),
    name: u.name,
    email: u.email,
    perms: (u.adminPerms || []).filter((p) => PAGES.includes(p)),
    active: u.status !== "disabled",
    lastActiveAt: u.lastActiveAt || null,
    createdAt: u.createdAt,
  };
}
const cleanPerms = (p) => (Array.isArray(p) ? [...new Set(p.filter((x) => PAGES.includes(x)))] : []);
const strongPass = (p) => typeof p === "string" && p.length >= 8 && /[A-Za-z]/.test(p) && /\d/.test(p);

router.get("/users", superOnly, async (req, res) => {
  try {
    const list = await User.find({ role: "admin", subAdmin: true }).sort({ createdAt: -1 });
    res.json(list.map(subRow));
  } catch (e) {
    res.status(500).json({ code: "server_error" });
  }
});

router.post("/users", superOnly, async (req, res) => {
  try {
    const b = req.body || {};
    const name = String(b.name || "").trim();
    const email = String(b.email || "").trim().toLowerCase();
    if (name.length < 2 || name.length > 80) return res.status(400).json({ code: "invalid_data" });
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return res.status(400).json({ code: "invalid_email" });
    if (!strongPass(b.password)) return res.status(400).json({ code: "weak_password" });
    if (await User.findOne({ email })) return res.status(409).json({ code: "email_exists" });
    const perms = cleanPerms(b.perms);
    const u = await User.create({
      name, email, role: "admin", status: "active",
      password: await bcrypt.hash(b.password, 12),
      subAdmin: true, adminPerms: perms, createdByAdmin: req.user._id,
    });
    await logAdmin(req, "admin_user_create", name, perms.join(", ") || "-");
    res.status(201).json(subRow(u));
  } catch (e) {
    console.error("Create admin user error:", e);
    res.status(500).json({ code: "server_error" });
  }
});

router.patch("/users/:id", superOnly, async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(404).json({ code: "not_found" });
    const u = await User.findOne({ _id: req.params.id, role: "admin", subAdmin: true });
    if (!u) return res.status(404).json({ code: "not_found" });
    const b = req.body || {};
    const notes = [];
    if (b.name !== undefined) {
      const name = String(b.name).trim();
      if (name.length < 2 || name.length > 80) return res.status(400).json({ code: "invalid_data" });
      if (name !== u.name) { u.name = name; notes.push("name"); }
    }
    if (b.perms !== undefined) {
      u.adminPerms = cleanPerms(b.perms);
      notes.push("perms: " + (u.adminPerms.join(", ") || "-"));
    }
    if (b.password) {
      if (!strongPass(b.password)) return res.status(400).json({ code: "weak_password" });
      u.password = await bcrypt.hash(b.password, 12);
      u.tokenVersion = (u.tokenVersion || 0) + 1;
      notes.push("password");
    }
    let action = "admin_user_update";
    if (typeof b.active === "boolean") {
      const st = b.active ? "active" : "disabled";
      if (u.status !== st) {
        u.status = st;
        if (!b.active) u.tokenVersion = (u.tokenVersion || 0) + 1;
        action = b.active ? "admin_user_enable" : "admin_user_disable";
      }
    }
    if (b.perms !== undefined) u.tokenVersion = u.tokenVersion || 0;
    await u.save();
    await logAdmin(req, action, u.name, notes.join(" | "));
    res.json(subRow(u));
  } catch (e) {
    console.error("Update admin user error:", e);
    res.status(500).json({ code: "server_error" });
  }
});

router.delete("/users/:id", superOnly, async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(404).json({ code: "not_found" });
    const u = await User.findOneAndDelete({ _id: req.params.id, role: "admin", subAdmin: true });
    if (!u) return res.status(404).json({ code: "not_found" });
    await logAdmin(req, "admin_user_delete", u.name, u.email);
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ code: "server_error" });
  }
});

router.get("/activity", superOnly, async (req, res) => {
  try {
    const q = {};
    if (req.query.user && mongoose.isValidObjectId(req.query.user)) q.actorId = req.query.user;
    if (req.query.action) q.action = String(req.query.action);
    if (req.query.from || req.query.to) {
      q.createdAt = {};
      if (req.query.from) q.createdAt.$gte = new Date(req.query.from + "T00:00:00");
      if (req.query.to) q.createdAt.$lte = new Date(req.query.to + "T23:59:59.999");
    }
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const size = 30;
    const [items, total] = await Promise.all([
      AdminLog.find(q).sort({ createdAt: -1 }).skip((page - 1) * size).limit(size).lean(),
      AdminLog.countDocuments(q),
    ]);
    res.json({
      total, page, pages: Math.max(1, Math.ceil(total / size)),
      items: items.map((l) => ({
        id: String(l._id), actorId: String(l.actorId || ""), actorName: l.actorName, actorEmail: l.actorEmail,
        isSub: !!l.isSub, action: l.action, target: l.target, detail: l.detail, ip: l.ip, at: l.createdAt,
      })),
    });
  } catch (e) {
    res.status(500).json({ code: "server_error" });
  }
});

// =====================================
// تصميم رسائل البريد (للأدمن الرئيسي فقط)
// =====================================
const logoUpload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 400 * 1024 } });
const LOGO_TYPES = ["image/png", "image/jpeg", "image/webp", "image/gif"];
const HEX = /^#[0-9a-fA-F]{6}$/;

function designOut(d) {
  const o = { ...sendEmail.DEFAULTS, ...(d || {}) };
  return {
    brandName: o.brandName, showBrandName: !!o.showBrandName, logoWidth: o.logoWidth,
    pageBg: o.pageBg, cardBg: o.cardBg, brandColor: o.brandColor, textColor: o.textColor, footerColor: o.footerColor,
    fontSize: o.fontSize, radius: o.radius, footerAr: o.footerAr, footerEn: o.footerEn,
    hasLogo: !!(d && d.logoData && d.logoData.length),
    logoUrl: d && d.logoData && d.logoData.length ? `data:${d.logoType};base64,${Buffer.from(d.logoData.buffer || d.logoData).toString("base64")}` : "",
  };
}

function cleanDesign(b) {
  const out = {};
  const str = (k, max) => { if (b[k] !== undefined) out[k] = String(b[k]).trim().slice(0, max); };
  str("brandName", 60); str("footerAr", 300); str("footerEn", 300);
  if (b.showBrandName !== undefined) out.showBrandName = !!b.showBrandName;
  for (const k of ["pageBg", "cardBg", "brandColor", "textColor", "footerColor"]) {
    if (b[k] !== undefined) { if (!HEX.test(b[k])) return null; out[k] = b[k]; }
  }
  const num = (k, lo, hi) => { if (b[k] !== undefined) { const n = Number(b[k]); if (!Number.isFinite(n)) return false; out[k] = Math.min(hi, Math.max(lo, Math.round(n))); } return true; };
  if (!num("logoWidth", 40, 300) || !num("fontSize", 12, 20) || !num("radius", 0, 30)) return null;
  return out;
}

router.get("/email-design", superOnly, async (req, res) => {
  try {
    res.json(designOut(await EmailDesign.findOne({ key: "email" }).lean()));
  } catch (e) {
    res.status(500).json({ code: "server_error" });
  }
});

router.put("/email-design", superOnly, async (req, res) => {
  try {
    const data = cleanDesign(req.body || {});
    if (!data) return res.status(400).json({ code: "invalid_data" });
    const d = await EmailDesign.findOneAndUpdate({ key: "email" }, { $set: data, $setOnInsert: { key: "email" } }, { new: true, upsert: true }).lean();
    await logAdmin(req, "email_design_update", "", Object.keys(data).join(", "));
    res.json(designOut(d));
  } catch (e) {
    console.error("Email design error:", e);
    res.status(500).json({ code: "server_error" });
  }
});

router.post("/email-design/logo", superOnly, (req, res) => {
  logoUpload.single("logo")(req, res, async (err) => {
    try {
      if (err) return res.status(400).json({ code: err.code === "LIMIT_FILE_SIZE" ? "file_too_big" : "invalid_data" });
      const f = req.file;
      if (!f || !LOGO_TYPES.includes(f.mimetype)) return res.status(400).json({ code: "file_type" });
      const d = await EmailDesign.findOneAndUpdate({ key: "email" }, { $set: { logoData: f.buffer, logoType: f.mimetype }, $setOnInsert: { key: "email" } }, { new: true, upsert: true }).lean();
      await logAdmin(req, "email_design_logo", f.originalname || "", "upload");
      res.json(designOut(d));
    } catch (e) {
      console.error("Email logo error:", e);
      res.status(500).json({ code: "server_error" });
    }
  });
});

router.delete("/email-design/logo", superOnly, async (req, res) => {
  try {
    const d = await EmailDesign.findOneAndUpdate({ key: "email" }, { $set: { logoData: null, logoType: "" }, $setOnInsert: { key: "email" } }, { new: true, upsert: true }).lean();
    await logAdmin(req, "email_design_logo", "", "remove");
    res.json(designOut(d));
  } catch (e) {
    res.status(500).json({ code: "server_error" });
  }
});

// معاينة بالتصميم الحالي (غير المحفوظ) — نفس دالة الإرسال الفعلية
router.post("/email-design/preview", superOnly, async (req, res) => {
  try {
    const b = req.body || {};
    const data = cleanDesign(b.design || {});
    if (!data) return res.status(400).json({ code: "invalid_data" });
    const saved = await EmailDesign.findOne({ key: "email" }).lean();
    const merged = { ...sendEmail.DEFAULTS, ...(saved || {}), ...data };
    const hasLogo = saved && saved.logoData && saved.logoData.length;
    const logo = hasLogo ? `data:${saved.logoType};base64,${Buffer.from(saved.logoData.buffer || saved.logoData).toString("base64")}` : "";
    const lang = b.lang === "en" ? "en" : "ar";
    const text = lang === "en"
      ? "Hello,\n\nThis is a sample reply from the administration so you can see how your messages will look.\n\n---\nYour message: Sample"
      : "مرحباً،\n\nهذه رسالة تجريبية من الإدارة لمعاينة شكل رسائل المنصة.\n\n---\nرسالتك: نص تجريبي";
    res.json({ html: sendEmail.renderHtml(text, merged, logo) });
  } catch (e) {
    res.status(500).json({ code: "server_error" });
  }
});

// إرسال رسالة تجريبية لبريد الأدمن نفسه
router.post("/email-design/test", superOnly, async (req, res) => {
  try {
    await sendEmail(req.user.email, "Shefaa - رسالة تجريبية", "مرحباً،\n\nهذه رسالة تجريبية لاختبار تصميم البريد.\n\nرمز تجريبي: 123456");
    await logAdmin(req, "email_design_test", req.user.email, "");
    res.json({ ok: true });
  } catch (e) {
    console.error("Email test error:", e.message || e);
    res.status(502).json({ code: "email_failed" });
  }
});

module.exports = router;
