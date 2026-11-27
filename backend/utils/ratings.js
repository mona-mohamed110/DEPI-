const Review = require("../models/Review");

// متوسط وعدد التقييمات المعتمدة لمجموعة أطباء/معامل: Map(id -> {avg, count})
async function ratingsFor(ids) {
  const out = new Map();
  if (!ids || !ids.length) return out;
  try {
    const rows = await Review.aggregate([
      { $match: { type: "provider", status: "approved", targetId: { $in: ids } } },
      { $group: { _id: "$targetId", avg: { $avg: "$rating" }, count: { $sum: 1 } } },
    ]);
    rows.forEach((r) => out.set(String(r._id), { avg: Math.round(r.avg * 10) / 10, count: r.count }));
  } catch (e) {
    console.error("Ratings error:", e.message || e);
  }
  return out;
}

module.exports = { ratingsFor };
