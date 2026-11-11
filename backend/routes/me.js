const express = require("express");
const User = require("../models/User");
const { requireAuth } = require("../middleware/auth");

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
    notifEmail: user.notifEmail,
    notifAppt: user.notifAppt,
    notifMeds: user.notifMeds,
    notifAccess: user.notifAccess,
    notifNew: user.notifNew,
    twoFactor: user.twoFactor,
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
      user.phone = String(body.phone).trim().slice(0, 20);
    }

    const flags = [
      "notifEmail",
      "notifAppt",
      "notifMeds",
      "notifAccess",
      "notifNew",
      "twoFactor",
    ];
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

router.post("/me/logout-all", requireAuth, function (req, res) {
  res.json({ ok: true });
});

module.exports = router;