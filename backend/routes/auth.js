
const express = require("express");
const { SPECIALTIES } = require("../data/catalog");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const crypto = require("crypto");
const sendEmail = require("../utils/sendEmail");
const { uploadCertificate } = require("../middleware/upload");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();

function publicUser(user) {
  return {
    id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    phone: user.phone,
    status: user.status,
  };
}

const LOGIN_CODE_TTL = 10 * 60 * 1000;

function hashCode(code) {
  return crypto.createHash("sha256").update(String(code)).digest("hex");
}

function issueSession(user) {
  const token = jwt.sign(
    {
      id: user._id,
      role: user.role,
      tokenVersion: user.tokenVersion || 0,
    },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );

  return { token: token, user: publicUser(user) };
}

function sendError(res, status, code) {
  return res.status(status).json({ code: code, message: code });
}
// Register
router.post("/register", uploadCertificate, async function (req, res) {
  try {
    const body = req.body;
    const role = body.role;

    if (!["patient", "doctor", "lab"].includes(role)) {
      return sendError(res, 400, "invalid_data");
    }

    if (!body.fullName || !body.email || !body.password) {
      return sendError(res, 400, "invalid_data");
    }

    // الطبيب لازم يرفع صورة الترخيص أثناء التسجيل
    if (role === "doctor" && !req.file) {
      return sendError(res, 400, "license_required");
    }

    const email = String(body.email).trim().toLowerCase();

    const oldUser = await User.findOne({ email });

    if (oldUser) {
      return sendError(res, 409, "email_exists");
    }

    if (role === "doctor" && !SPECIALTIES.some((x) => x.id === body.extra)) {
      return sendError(res, 400, "invalid_data");
    }

    const hashedPassword = await bcrypt.hash(body.password, 10);

    let name = body.fullName;

    if (role === "lab" && body.extra) {
      name = body.extra;
    }

    const status = role === "patient" ? "active" : "pending";

    let profile = body.profile || {};

    if (typeof profile === "string") {
      try {
        profile = JSON.parse(profile);
      } catch (error) {
        profile = {};
      }
    }

    const certificate = req.file
      ? "uploads/" + req.file.filename
      : "";

    const certificateName = req.file
      ? req.file.originalname
      : "";

    const certificateType = req.file
      ? req.file.mimetype
      : "";

    const licenseBy =
      role === "doctor"
        ? "syndicate"
        : role === "lab"
        ? "ministry"
        : "";

    const licenseSentAt =
      role !== "patient" ? new Date() : undefined;

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      phone: body.phone || "",
      role,
      status,
      extra: body.extra || "",
      specialty: role === "doctor" ? body.extra : undefined,

      license: body.license || "",
      licenseStatus: role !== "patient" ? "pend" : undefined,
      licenseReason: "",

      licenseBy,
      licenseSentAt,

      certificate,
      certificateName,
      certificateType,

      profile,
    });

    res.status(201).json({
      ok: true,
      status: user.status,
    });
  } catch (error) {
    console.error("Register error:", error);
    sendError(res, 500, "server_error");
  }
});

// Login
router.post("/login", async function (req, res) {
  try {
    const email = String(req.body.email || "").trim().toLowerCase();
    const password = String(req.body.password || "");

    const user = await User.findOne({ email: email });

if (!user || !user.password) {
  return sendError(res, 401, "invalid_credentials");
}

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return sendError(res, 401, "invalid_credentials");
    }

    if (user.status === "disabled") {
      return sendError(res, 403, "account_disabled");
    }

    if (user.status === "pending") {
      return sendError(res, 403, "pending_license");
    }

    // التحقق بخطوتين: بعد نجاح كلمة المرور نرسل كوداً على الإيميل ولا نعطي توكن قبل إدخاله
    if (user.twoFactor === true) {
      const now = Date.now();
      const sentAt = user.loginCodeExpires
        ? new Date(user.loginCodeExpires).getTime() - LOGIN_CODE_TTL
        : 0;

      // لا نعيد إرسال كود جديد قبل مرور 30 ثانية (منع إغراق البريد)
      if (!user.loginCode || now - sentAt > 30 * 1000) {
        const code = String(Math.floor(100000 + Math.random() * 900000));

        user.loginCode = hashCode(code);
        user.loginCodeExpires = new Date(now + LOGIN_CODE_TTL);
        user.loginAttempts = 0;
        await user.save();

        try {
          await sendEmail(
            user.email,
            "Shifa - Login verification code",
            "Your login verification code is: " +
              code +
              "\nThis code is valid for 10 minutes. If you did not try to log in, change your password."
          );
        } catch (mailError) {
          if (
            mailError.code === "EMAIL_NOT_CONFIGURED" &&
            process.env.NODE_ENV !== "production"
          ) {
            console.warn("[DEV] كود تسجيل الدخول للبريد " + user.email + " هو: " + code);
          } else {
            console.error("Login code email error:", mailError.message || mailError);
            return sendError(res, 500, "server_error");
          }
        }
      }

      return res.json({ twoFactor: true, email: user.email });
    }

    res.json(issueSession(user));
  } catch (error) {
    console.error("Login error:", error);
    sendError(res, 500, "server_error");
  }
});

// Verify the login code (two-step verification)
router.post("/login-verify", async function (req, res) {
  try {
    const email = String(req.body.email || "").trim().toLowerCase();
    const code = String(req.body.code || "").trim();

    const user = await User.findOne({ email: email });

    if (
      !user ||
      !user.loginCode ||
      !user.loginCodeExpires ||
      user.loginCodeExpires < new Date() ||
      (user.loginAttempts || 0) >= 5
    ) {
      return sendError(res, 400, "invalid_code");
    }

    // 5 محاولات فقط لكل كود
    if (user.loginCode !== hashCode(code)) {
      user.loginAttempts = (user.loginAttempts || 0) + 1;
      await user.save();
      return sendError(res, 400, "invalid_code");
    }

    if (user.status === "disabled") {
      return sendError(res, 403, "account_disabled");
    }

    if (user.status === "pending") {
      return sendError(res, 403, "pending_license");
    }

    // الكود يُستخدم مرة واحدة
    user.loginCode = "";
    user.loginCodeExpires = undefined;
    user.loginAttempts = 0;
    await user.save();

    res.json(issueSession(user));
  } catch (error) {
    console.error("Login verify error:", error);
    sendError(res, 500, "server_error");
  }
});

// Current user
router.get("/me", requireAuth, async function (req, res) {
  res.json(publicUser(req.user));
});

// Forgot password
router.post("/forgot-password", async function (req, res) {
  try {
    const email = String(req.body.email || "").trim().toLowerCase();

    const user = await User.findOne({ email: email });

    if (!user) {
      return res.json({ ok: true });
    }

    const code = String(
      Math.floor(100000 + Math.random() * 900000)
    );

    user.resetCode = code;
    user.resetToken = "";
    user.resetAttempts = 0;
    user.resetExpires = new Date(Date.now() + 10 * 60 * 1000);

    await user.save();

    try {
      await sendEmail(
        email,
        "Shifa - Password reset code",
        "Your verification code is: " +
          code +
          "\nThis code is valid for 10 minutes."
      );
    } catch (mailError) {
      // أثناء التطوير فقط (بدون إعداد البريد): نطبع الكود في نافذة الباك إند حتى يمكن اختبار الخطوات
      if (
        mailError.code === "EMAIL_NOT_CONFIGURED" &&
        process.env.NODE_ENV !== "production"
      ) {
        console.warn(
          "[DEV] البريد غير مضبوط. كود التحقق للبريد " + email + " هو: " + code
        );
        return res.json({ ok: true });
      }

      throw mailError;
    }

    res.json({ ok: true });
  } catch (error) {
    console.error("Forgot password error:", error.message || error);
    sendError(res, 500, "server_error");
  }
});

// Verify reset code
router.post("/verify-code", async function (req, res) {
  try {
    const email = String(req.body.email || "").trim().toLowerCase();
    const code = String(req.body.code || "");

    const user = await User.findOne({ email: email });

    if (
      !user ||
      !user.resetCode ||
      !user.resetExpires ||
      user.resetExpires < new Date() ||
      (user.resetAttempts || 0) >= 5
    ) {
      return sendError(res, 400, "invalid_code");
    }

    // 5 محاولات فقط لكل كود (حماية من تخمين الكود)
    if (user.resetCode !== code) {
      user.resetAttempts = (user.resetAttempts || 0) + 1;
      await user.save();
      return sendError(res, 400, "invalid_code");
    }

    const resetToken = crypto.randomBytes(16).toString("hex");

    user.resetToken = resetToken;
    user.resetCode = "";

    await user.save();

    res.json({ resetToken: resetToken });
  } catch (error) {
    console.error("Verify code error:", error);
    sendError(res, 500, "server_error");
  }
});

// Reset password
router.post("/reset-password", async function (req, res) {
  try {
    const email = String(req.body.email || "").trim().toLowerCase();
    const resetToken = String(req.body.resetToken || "");
    const password = String(req.body.password || "");

    const user = await User.findOne({ email: email });

    if (
      !user ||
      !user.resetToken ||
      user.resetToken !== resetToken ||
      !user.resetExpires ||
      user.resetExpires < new Date() ||
      password.length < 6
    ) {
      return sendError(res, 400, "invalid_code");
    }

    user.password = await bcrypt.hash(password, 10);
    user.resetToken = "";
    user.resetCode = "";
    user.resetAttempts = 0;
    user.resetExpires = undefined;
    // تسجيل الخروج من كل الأجهزة بعد استعادة كلمة المرور
    user.tokenVersion = (user.tokenVersion || 0) + 1;

    await user.save();

    res.json({ ok: true });
  } catch (error) {
    console.error("Reset password error:", error);
    sendError(res, 500, "server_error");
  }
});

// Logout
router.post("/logout", function (req, res) {
  res.json({ ok: true });
});

// Change password
router.post("/change-password", requireAuth, async function (req, res) {
  try {
    const current = String(req.body.current || "");
    const next = String(req.body.next || "");

    if (!current || !next || next.length < 6) {
      return sendError(res, 400, "invalid_data");
    }

    const user = await User.findById(req.user._id);

    if (!user) {
      return sendError(res, 404, "not_found");
    }

    const isMatch = await bcrypt.compare(current, user.password);

    if (!isMatch) {
      return sendError(res, 400, "wrong_password");
    }

    user.password = await bcrypt.hash(next, 10);

    await user.save();

    res.json({ ok: true });
  } catch (error) {
    console.error("Change password error:", error);
    sendError(res, 500, "server_error");
  }
});

module.exports = router;
