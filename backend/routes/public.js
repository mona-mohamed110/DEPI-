const express = require("express");
const User = require("../models/User");

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
      .select("name role extra")
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
      specialty: {
        ar: user.extra || (user.role === "lab" ? "معمل تحاليل" : "طبيب"),
        en: user.extra || (user.role === "lab" ? "Medical Lab" : "Doctor"),
      },
      address: { ar: "غير محدد", en: "Not specified" },
      city: { ar: "غير محدد", en: "Not specified" },
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

module.exports = router;