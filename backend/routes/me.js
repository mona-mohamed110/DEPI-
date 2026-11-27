const express = require("express");
const User = require("../models/User");
const { requireAuth, requireRole } = require("../middleware/auth");

const router = express.Router();

function sendError(res, status, code) {
  return res.status(status).json({ code: code, message: code });
}

function meData(user) {
  return {
    id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    phone: user.phone,
    status: user.status,
    twoFactor: user.twoFactor,
    queueOnly: !!user.queueOnly,
  };
}

router.get("/me", requireAuth, async function (req, res) {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return sendError(res, 404, "not_found");
    }
    res.json(meData(user));
  } catch (error) {
    sendError(res, 500, "server_error");
  }
});

router.put("/me", requireAuth, async function (req, res) {
  try {
    const body = req.body;
    const user = await User.findById(req.user._id);
    if (!user) {
      return sendError(res, 404, "not_found");
    }

    if (body.name !== undefined) {
      const name = String(body.name).trim();
      if (name.length < 2) {
        return sendError(res, 400, "invalid_data");
      }
      user.name = name.slice(0, 80);
    }

    if (body.email !== undefined) {
      const email = String(body.email).trim().toLowerCase();
      if (!email.includes("@") || !email.includes(".")) {
        return sendError(res, 400, "invalid_data");
      }
      const other = await User.findOne({ email: email });
      if (other && String(other._id) !== String(user._id)) {
        return sendError(res, 409, "email_exists");
      }
      user.email = email;
    }

    if (body.phone !== undefined) {
      const ph = String(body.phone).replace(/[\s-]/g, "");
      if (!/^\d{11}$/.test(ph)) {
        return sendError(res, 400, "invalid_phone");
      }
      user.phone = ph;
    }

    const flags = user.role === "doctor" ? ["twoFactor", "queueOnly"] : ["twoFactor"];
    flags.forEach(function (key) {
      if (typeof body[key] === "boolean") {
        user[key] = body[key];
      }
    });

    await user.save();
    res.json(meData(user));
  } catch (error) {
    sendError(res, 500, "server_error");
  }
});

// موقع العيادة/المعمل على الخريطة (للطبيب والمعمل فقط)
router.get("/me/location", requireAuth, requireRole("doctor", "lab"), async function (req, res) {
  try {
    const user = await User.findById(req.user._id).select("location");
    const loc = (user && user.location) || {};
    res.json({
      lat: Number.isFinite(loc.lat) ? loc.lat : null,
      lng: Number.isFinite(loc.lng) ? loc.lng : null,
    });
  } catch (error) {
    sendError(res, 500, "server_error");
  }
});

router.put("/me/location", requireAuth, requireRole("doctor", "lab"), async function (req, res) {
  try {
    const lat = Number(req.body.lat);
    const lng = Number(req.body.lng);
    if (!Number.isFinite(lat) || !Number.isFinite(lng) || Math.abs(lat) > 90 || Math.abs(lng) > 180) {
      return sendError(res, 400, "invalid_data");
    }
    await User.updateOne({ _id: req.user._id }, { $set: { location: { lat, lng } } });
    res.json({ lat, lng });
  } catch (error) {
    sendError(res, 500, "server_error");
  }
});

// ===== صورة البروفايل (مريض / طبيب / معمل / استقبال) =====
router.get("/me/avatar", requireAuth, async function (req, res) {
  try {
    const u = await User.findById(req.user._id).select("+avatar");
    res.json({ avatar: (u && u.avatar) || "" });
  } catch (error) {
    sendError(res, 500, "server_error");
  }
});

router.put("/me/avatar", requireAuth, async function (req, res) {
  try {
    const data = String((req.body && req.body.avatar) || "");
    const prefix = "data:image/jpeg;base64,";
    if (!data.startsWith(prefix) || data.length > 90000) return sendError(res, 400, "invalid_image");
    const buf = Buffer.from(data.slice(prefix.length), "base64");
    // JPEG حقيقي فقط (يبدأ بـ FF D8 FF)
    if (buf.length < 100 || buf[0] !== 0xff || buf[1] !== 0xd8 || buf[2] !== 0xff || buf[buf.length - 2] !== 0xff || buf[buf.length - 1] !== 0xd9) return sendError(res, 400, "invalid_image");
    // صورة واحدة لكل مستخدم: لا رفع قبل حذف الحالية
    const r = await User.updateOne({ _id: req.user._id, $or: [{ avatar: "" }, { avatar: null }, { avatar: { $exists: false } }] }, { $set: { avatar: data, avatarAt: new Date() } });
    if (!r.matchedCount) return sendError(res, 409, "avatar_exists");
    res.json({ avatar: data });
  } catch (error) {
    sendError(res, 500, "server_error");
  }
});

router.delete("/me/avatar", requireAuth, async function (req, res) {
  try {
    await User.updateOne({ _id: req.user._id }, { $set: { avatar: "", avatarAt: null } });
    res.json({ avatar: "" });
  } catch (error) {
    sendError(res, 500, "server_error");
  }
});

router.post("/me/logout-all", requireAuth, async function (req, res) {
  try {
    await User.updateOne(
      { _id: req.user._id },
      { $inc: { tokenVersion: 1 } }
    );

    res.json({ ok: true });
  } catch (error) {
    console.error("Logout all error:", error);
    sendError(res, 500, "server_error");
  }
});

module.exports = router;