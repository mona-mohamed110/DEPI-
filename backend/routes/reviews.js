const express = require("express");
const mongoose = require("mongoose");
const Review = require("../models/Review");
const Booking = require("../models/Booking");
const User = require("../models/User");
const { requireAuth, requireRole } = require("../middleware/auth");

const router = express.Router();
router.use(requireAuth);

function parse(body) {
  const rating = Number(body && body.rating);
  const comment = String((body && body.comment) || "").replace(/\s+/g, " ").trim().slice(0, 500);
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) return null;
  return { rating, comment };
}

const row = (r) => ({
  id: String(r._id), type: r.type, rating: r.rating, comment: r.comment, status: r.status,
  targetId: r.targetId ? String(r.targetId) : "", targetRole: r.targetRole, targetName: r.targetName,
  bookingId: r.bookingId ? String(r.bookingId) : "", createdAt: r.createdAt,
});

// ===== المريض: زيارات منتهية لم يقيّمها + تقييماته السابقة =====
router.get("/provider/mine", requireRole("patient"), async (req, res) => {
  try {
    const [done, mine] = await Promise.all([
      Booking.find({ patientId: req.user._id, status: "done" }).sort({ date: -1, time: -1 }).limit(100).populate("providerId", "name role"),
      Review.find({ authorId: req.user._id, type: "provider" }).sort({ createdAt: -1 }),
    ]);
    const rated = new Set(mine.map((r) => String(r.bookingId)));
    const toRate = done
      .filter((b) => b.providerId && !rated.has(String(b._id)))
      .map((b) => ({ bookingId: String(b._id), kind: b.kind, providerId: String(b.providerId._id), providerName: b.providerId.name, date: b.date }));
    res.json({ toRate, mine: mine.map(row) });
  } catch (e) {
    res.status(500).json({ code: "server_error" });
  }
});

router.post("/provider", requireRole("patient"), async (req, res) => {
  try {
    const data = parse(req.body);
    if (!data || !mongoose.isValidObjectId(req.body.bookingId)) return res.status(400).json({ code: "invalid_data" });
    const b = await Booking.findOne({ _id: req.body.bookingId, patientId: req.user._id, status: "done" });
    if (!b) return res.status(404).json({ code: "not_found" });
    if (await Review.findOne({ authorId: req.user._id, bookingId: b._id })) return res.status(409).json({ code: "already_reviewed" });
    const target = await User.findById(b.providerId).select("name role");
    if (!target) return res.status(404).json({ code: "not_found" });
    const r = await Review.create({
      type: "provider", authorId: req.user._id, authorRole: "patient", authorName: req.user.name,
      targetId: target._id, targetRole: target.role === "lab" ? "lab" : "doctor", targetName: target.name,
      bookingId: b._id, ...data,
    });
    res.status(201).json(row(r));
  } catch (e) {
    if (e && e.code === 11000) return res.status(409).json({ code: "already_reviewed" });
    console.error("Provider review error:", e);
    res.status(500).json({ code: "server_error" });
  }
});

// ===== تقييم المنصة: مريض / طبيب / معمل (تقييم واحد لكل مستخدم، قابل للتعديل ويعود للمراجعة) =====
const PLATFORM_ROLES = ["patient", "doctor", "lab"];

router.get("/platform", requireRole(...PLATFORM_ROLES), async (req, res) => {
  try {
    const r = await Review.findOne({ authorId: req.user._id, type: "platform" });
    res.json(r ? row(r) : null);
  } catch (e) {
    res.status(500).json({ code: "server_error" });
  }
});

router.put("/platform", requireRole(...PLATFORM_ROLES), async (req, res) => {
  try {
    const data = parse(req.body);
    if (!data) return res.status(400).json({ code: "invalid_data" });
    const r = await Review.findOneAndUpdate(
      { authorId: req.user._id, type: "platform" },
      { $set: { ...data, authorRole: req.user.role, authorName: req.user.name, status: "pending", featured: false }, $setOnInsert: { type: "platform", authorId: req.user._id } },
      { new: true, upsert: true }
    );
    res.json(row(r));
  } catch (e) {
    console.error("Platform review error:", e);
    res.status(500).json({ code: "server_error" });
  }
});

module.exports = router;
