
const jwt = require("jsonwebtoken");
const User = require("../models/User");

async function requireAuth(req, res, next) {
  try {
    const header = req.headers.authorization || "";
    const token = header.startsWith("Bearer ") ? header.slice(7) : null;

    if (!token) {
      return res.status(401).json({
        code: "unauthorized",
        message: "لازم تسجل دخول",
      });
    }

    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(payload.id);

    if (!user) {
      return res.status(401).json({
        code: "unauthorized",
        message: "المستخدم مش موجود",
      });
    }

    if (user.status === "disabled") {
      return res.status(403).json({
        code: "account_disabled",
        message: "الحساب متوقف",
      });
    }

    // تحديث آخر نشاط مرة كل دقيقة لتجنب الكتابة المتكررة
    const now = Date.now();
    const lastActivity = user.lastActiveAt
      ? new Date(user.lastActiveAt).getTime()
      : 0;

    if (now - lastActivity >= 60 * 1000) {
      User.updateOne(
        { _id: user._id },
        { $set: { lastActiveAt: new Date(now) } }
      ).catch((error) => {
        console.error("Update last activity error:", error);
      });
    }

    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({
      code: "unauthorized",
      message: "التوكن غلط أو منتهي",
    });
  }
}

function requireRole(...roles) {
  return function (req, res, next) {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        code: "forbidden",
        message: "مش مسموحلك",
      });
    }

    next();
  };
}

module.exports = { requireAuth, requireRole };
