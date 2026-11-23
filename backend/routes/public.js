const express = require("express");
const User = require("../models/User");
const ContactMessage = require("../models/ContactMessage");
const { specialtyView } = require("../data/catalog");

const router = express.Router();

// البحث عن الأطباء والمعامل
router.get("/places", async (req, res) => {
  try {
    const { type, q } = req.query;

    const filter = {
      status: "active",
      role: ["doctor", "lab"],
    };

    if (type === "doctor" || type === "lab") {
      filter.role = type;
    }

    let providers = await User.find(filter)
      .select("name role extra specialty address location")
      .sort({ name: 1 });

    if (q) {
      const search = String(q).trim().toLowerCase();

      providers = providers.filter((user) =>
        `${user.name} ${user.extra || ""}`
          .toLowerCase()
          .includes(search)
      );
    }

    const places = providers.map((user, index) => ({
      id: user._id.toString(),
      type: user.role,
      name: {
        ar: user.name,
        en: user.name,
      },
      specialty: user.role === "lab"
        ? { ar: "معمل تحاليل", en: "Medical Lab" }
        : specialtyView(user.specialty || user.extra) || { ar: "طبيب", en: "Doctor" },
      address: user.address
        ? { ar: user.address, en: user.address }
        : { ar: "غير محدد", en: "Not specified" },
      city: { ar: "غير محدد", en: "Not specified" },
      lat: user.location && Number.isFinite(user.location.lat) ? user.location.lat : null,
      lng: user.location && Number.isFinite(user.location.lng) ? user.location.lng : null,
      rating: 0,
      x: 15 + ((index * 23) % 75),
      y: 20 + ((index * 17) % 65),
    }));

    return res.json(places);
  } catch (error) {
    console.error("Search places error:", error);
    return res.status(500).json({ code: "server_error" });
  }
});


// رسالة تواصل من الصفحة الرئيسية
const contactHits = new Map();
router.post("/contact", express.json({ limit: "20kb" }), async (req, res) => {
  try {
    // حد بسيط: 5 رسائل كل ساعة لكل IP
    const ip = req.ip, now = Date.now();
    const hits = (contactHits.get(ip) || []).filter((t) => now - t < 3600000);
    if (hits.length >= 5) return res.status(429).json({ code: "too_many_requests" });

    const b = req.body || {};
    const email = String(b.email || "").trim().toLowerCase();
    const message = String(b.message || "").trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || message.length < 5) {
      return res.status(400).json({ code: "invalid_data" });
    }

    hits.push(now);
    contactHits.set(ip, hits);
    await ContactMessage.create({
      name: String(b.name || "").trim().slice(0, 80),
      email,
      message: message.slice(0, 2000),
    });
    res.json({ ok: true });
  } catch (error) {
    console.error("Contact error:", error);
    res.status(500).json({ code: "server_error" });
  }
});

module.exports = router;
