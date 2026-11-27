const AdminLog = require("../models/AdminLog");

// تسجيل إجراء في لوحة التحكم (لا يوقف الطلب عند الفشل)
async function logAdmin(req, action, target = "", detail = "", userOverride) {
  try {
    const u = userOverride || req.user;
    if (!u) return;
    await AdminLog.create({
      actorId: u._id,
      actorName: u.name || "",
      actorEmail: u.email || "",
      isSub: !!u.subAdmin,
      action,
      target: String(target || "").slice(0, 200),
      detail: String(detail || "").slice(0, 400),
      ip: String((req && (req.ip || (req.headers && req.headers["x-forwarded-for"]))) || "").slice(0, 60),
    });
  } catch (e) {
    console.error("Admin log error:", e.message || e);
  }
}

module.exports = { logAdmin };
