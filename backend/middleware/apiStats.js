
const ApiRequestStat = require("../models/ApiRequestStat");

function getDateKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function trackApiRequests(req, res, next) {
  // استبعاد طلبات OPTIONS وطلب المراقبة نفسه
  if (
    req.method === "OPTIONS" ||
    req.path === "/admin/monitoring"
  ) {
    return next();
  }

  res.once("finish", () => {
    const date = getDateKey();

    ApiRequestStat.updateOne(
      { date },
      { $inc: { count: 1 } },
      { upsert: true }
    ).catch((error) => {
      console.error("API request tracking error:", error);
    });
  });

  next();
}

module.exports = { trackApiRequests, getDateKey };
