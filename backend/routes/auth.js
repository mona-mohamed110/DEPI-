
const express = require("express");
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

    const email = String(body.email).trim().toLowerCase();

    const oldUser = await User.findOne({ email: email });

    if (oldUser) {
      return sendError(res, 409, "email_exists");
    }

    const hashedPassword = await bcrypt.hash(body.password, 10);

    let name = body.fullName;

    if (role === "lab" && body.extra) {
      name = body.extra;
    }

    const status = role === "patient" ? "active" : "pending";

    // Parse profile sent as JSON text
    let profile = body.profile || {};

    if (typeof profile === "string") {
      try {
        profile = JSON.parse(profile);
      } catch (error) {
        profile = {};
      }
    }

    // Certificate information
    let certificate = "";
    let certificateName = "";
    let certificateType = "";

    if (req.file) {
      certificate = "uploads/" + req.file.filename;
      certificateName = req.file.originalname;
      certificateType = req.file.mimetype;
    }

    // License information
    const licenseBy =
      role === "doctor"
        ? "syndicate"
        : role === "lab"
        ? "ministry"
        : "";

    const licenseSentAt =
      role !== "patient" ? new Date() : undefined;

    const user = await User.create({
      name: name,
      email: email,
      password: hashedPassword,
      phone: body.phone || "",
      role: role,
      status: status,
      extra: body.extra || "",

      license: body.license || "",
      licenseStatus: role !== "patient" ? "pend" : undefined,
      licenseReason: "",

      licenseBy: licenseBy,
      licenseSentAt: licenseSentAt,

      certificate: certificate,
      certificateName: certificateName,
      certificateType: certificateType,

      profile: profile,
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

    if (!user) {
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

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({
      token: token,
      user: publicUser(user),
    });
  } catch (error) {
    console.error("Login error:", error);
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
    user.resetExpires = new Date(Date.now() + 10 * 60 * 1000);

    await user.save();

    await sendEmail(
      email,
      "Shifa - Password reset code",
      "Your verification code is: " +
        code +
        "\nThis code is valid for 10 minutes."
    );

    res.json({ ok: true });
  } catch (error) {
    console.error("Forgot password error:", error);
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
      user.resetCode !== code ||
      !user.resetExpires ||
      user.resetExpires < new Date()
    ) {
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
    user.resetExpires = undefined;

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
