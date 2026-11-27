const express = require("express");
const User = require("../models/User");
const ContactMessage = require("../models/ContactMessage");
const { getSchedule } = require("../utils/schedule");
const { ratingsFor } = require("../utils/ratings");
const Review = require("../models/Review");
const { specialtyView, TEST_INFO, labOfferedTests } = require("../data/catalog");

// اسم الفحص بالعربية والإنجليزية (للبحث عن معمل بالتحليل المتاح فيه)
function testSearchText(user) {
  return labOfferedTests(user)
    .map((n) => {
      const i = TEST_INFO.find((t) => t.ar === n);
      return i ? `${i.ar} ${i.en}` : n;
    })
    .join(" ");
}

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
      .select("name role extra specialty address location labProfile schedule avatarAt")
      .sort({ name: 1 });

    if (q) {
      const search = String(q).trim().toLowerCase();

      providers = providers.filter((user) => {
        // البحث بالاسم وباسم التخصص بالعربية والإنجليزية (التخصص يُحفظ كمعرّف مثل sp_cardio)
        const sp = user.role === "doctor" ? specialtyView(user.specialty || user.extra) : null;
        const spText = sp && typeof sp === "object" ? `${sp.ar} ${sp.en}` : sp || "";
        const testsText = user.role === "lab" ? testSearchText(user) : "";
        return `${user.name} ${user.extra || ""} ${spText} ${testsText}`
          .toLowerCase()
          .includes(search);
      });
    }

    const rated = await ratingsFor(providers.map((u) => u._id));
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
      // الفحوصات التي يوفرها المعمل (لتصفية قائمة الحجز)
      ...(user.role === "lab" ? { tests: labOfferedTests(user) } : {}),
      // ساعات العمل الفعلية (٧ أيام، الأحد = 0) — تتحكم في الأيام والمواعيد المعروضة للحجز
      schedule: getSchedule(user),
      rating: (rated.get(String(user._id)) || {}).avg || 0,
      ratingCount: (rated.get(String(user._id)) || {}).count || 0,
      avatarV: user.avatarAt ? new Date(user.avatarAt).getTime() : 0,
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
    const phone = String(b.phone || "").replace(/[\s-]/g, "");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || message.length < 5 || !/^\d{11}$/.test(phone)) {
      return res.status(400).json({ code: "invalid_data" });
    }

    hits.push(now);
    contactHits.set(ip, hits);
    await ContactMessage.create({
      kind: ["message", "complaint", "suggestion"].includes(b.kind) ? b.kind : "message",
      subject: String(b.subject || "").trim().slice(0, 120),
      name: String(b.name || "").trim().slice(0, 80),
      email,
      phone,
      message: message.slice(0, 2000),
      role: "visitor",
    });
    res.json({ ok: true });
  } catch (error) {
    console.error("Contact error:", error);
    res.status(500).json({ code: "server_error" });
  }
});

// صورة طبيب/معمل للعامة (المرضى لا تُعرض صورهم)
router.get("/avatar/:id", async (req, res) => {
  try {
    if (!require("mongoose").isValidObjectId(req.params.id)) return res.status(404).end();
    const u = await User.findOne({ _id: req.params.id, role: { $in: ["doctor", "lab"] }, status: "active" }).select("+avatar");
    if (!u || !u.avatar) return res.status(404).end();
    const buf = Buffer.from(u.avatar.replace(/^data:image\/jpeg;base64,/, ""), "base64");
    res.set({ "Content-Type": "image/jpeg", "Cache-Control": "public, max-age=3600", "Cross-Origin-Resource-Policy": "cross-origin" });
    res.send(buf);
  } catch (e) {
    res.status(500).end();
  }
});

// آراء المستخدمين المختارة من الإدارة للصفحة الرئيسية (حد أقصى ٤)
router.get("/testimonials", async (req, res) => {
  try {
    const User = require("../models/User");
    const site = await require("../models/SiteSettings").findOne({ key: "site" }).lean();
    if (site && site.showTestimonials === false) return res.json({ visible: false, items: [], stats: {} });
    const [list, patients, doctors, labs, avg] = await Promise.all([
      Review.find({ type: "platform", status: "approved", featured: true }).sort({ updatedAt: -1 }).limit(4),
      User.countDocuments({ role: "patient", status: "active" }),
      User.countDocuments({ role: "doctor", status: "active" }),
      User.countDocuments({ role: "lab", status: "active" }),
      Review.aggregate([{ $match: { type: "platform", status: "approved" } }, { $group: { _id: null, avg: { $avg: "$rating" } } }]),
    ]);
    // صور أصحاب الآراء المختارة فقط (تظهر علناً لأن الأدمن اختار نشر رأيهم)
    const users = await User.find({ _id: { $in: list.map((r) => r.authorId) } }).select("+avatar");
    const photo = new Map(users.map((u) => [String(u._id), u.avatar || ""]));
    res.json({
      visible: true,
      items: list.map((r) => ({
        avatar: photo.get(String(r.authorId)) || "",
        id: String(r._id),
        name: String(r.authorName || "").split(/\s+/).slice(0, 2).join(" "),
        role: r.authorRole,
        rating: r.rating,
        comment: r.comment,
      })),
      // أرقام حقيقية من المنصة (لا أرقام ثابتة)
      stats: { patients, doctors, labs, satisfaction: avg.length ? Math.round((avg[0].avg / 5) * 100) : null },
    });
  } catch (e) {
    res.status(500).json({ code: "server_error" });
  }
});

module.exports = router;
