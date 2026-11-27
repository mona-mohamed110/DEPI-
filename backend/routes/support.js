// تواصل المستخدمين المسجلين (مريض / طبيب / معمل / استقبال) مع الإدارة: رسالة، شكوى، اقتراح + متابعة الردود
const express = require("express");
const mongoose = require("mongoose");
const ContactMessage = require("../models/ContactMessage");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();
router.use(requireAuth);

const KINDS = ["message", "complaint", "suggestion"];
const hits = new Map();

function view(m) {
  return {
    id: String(m._id),
    kind: m.kind,
    subject: m.subject,
    message: m.message,
    status: m.status,
    unread: !!m.userUnread,
    createdAt: m.createdAt,
    updatedAt: m.updatedAt,
    replies: (m.replies || []).map((r) => ({
      id: String(r._id),
      from: r.from,
      text: r.text,
      at: r.at,
    })),
  };
}

// رسائلي (الأحدث أولاً)
router.get("/mine", async (req, res) => {
  try {
    const list = await ContactMessage.find({ userId: req.user._id }).sort({ updatedAt: -1 }).limit(100);
    res.json(list.map(view));
  } catch (error) {
    console.error("Support list error:", error);
    res.status(500).json({ code: "server_error" });
  }
});

// عدد الردود غير المقروءة (للتنبيه)
router.get("/unread", async (req, res) => {
  try {
    res.json({ count: await ContactMessage.countDocuments({ userId: req.user._id, userUnread: true }) });
  } catch (error) {
    res.status(500).json({ code: "server_error" });
  }
});

// إرسال رسالة جديدة للإدارة
router.post("/", async (req, res) => {
  try {
    const key = String(req.user._id);
    const now = Date.now();
    const recent = (hits.get(key) || []).filter((t) => now - t < 3600 * 1000);
    if (recent.length >= 10) return res.status(429).json({ code: "too_many_requests" });

    const b = req.body || {};
    const message = String(b.message || "").trim();
    const subject = String(b.subject || "").trim().slice(0, 120);
    const kind = KINDS.includes(b.kind) ? b.kind : "message";
    if (message.length < 5) return res.status(400).json({ code: "invalid_data" });

    recent.push(now);
    hits.set(key, recent);

    const doc = await ContactMessage.create({
      kind,
      subject,
      message: message.slice(0, 2000),
      userId: req.user._id,
      role: req.user.role,
      name: req.user.name,
      email: req.user.email,
      phone: req.user.phone || "",
    });
    res.status(201).json(view(doc));
  } catch (error) {
    console.error("Support create error:", error);
    res.status(500).json({ code: "server_error" });
  }
});

async function mine(req) {
  if (!mongoose.isValidObjectId(req.params.id)) return null;
  return ContactMessage.findOne({ _id: req.params.id, userId: req.user._id });
}

// رد المستخدم على محادثة (متابعة)
router.post("/:id/reply", async (req, res) => {
  try {
    const m = await mine(req);
    if (!m) return res.status(404).json({ code: "not_found" });
    if (m.status === "closed") return res.status(409).json({ code: "conversation_closed" });

    const text = String((req.body && req.body.text) || "").trim();
    if (text.length < 2) return res.status(400).json({ code: "invalid_data" });
    if (m.replies.length >= 100) return res.status(429).json({ code: "too_many_requests" });

    m.replies.push({ from: "user", text: text.slice(0, 2000), byName: req.user.name });
    m.status = "new";
    m.adminUnread = true;
    await m.save();
    res.json(view(m));
  } catch (error) {
    console.error("Support reply error:", error);
    res.status(500).json({ code: "server_error" });
  }
});

// وضع علامة "مقروء" على ردود الإدارة
router.post("/:id/seen", async (req, res) => {
  try {
    const m = await mine(req);
    if (!m) return res.status(404).json({ code: "not_found" });
    if (m.userUnread) {
      m.userUnread = false;
      await m.save();
    }
    res.json(view(m));
  } catch (error) {
    res.status(500).json({ code: "server_error" });
  }
});

module.exports = router;
