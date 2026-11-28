const { getSchedule } = require("./schedule");
const { specialtyView, labOfferedTests } = require("../data/catalog");

// شكل الطبيب/المعمل كما تعرضه الصفحة العامة وصفحة الحجز
function placeView(user, rated) {
  const r = (rated && rated.get(String(user._id))) || {};
  return {
    id: user._id.toString(),
    type: user.role,
    name: { ar: user.name, en: user.name },
    specialty: user.role === "lab"
      ? { ar: "معمل تحاليل", en: "Medical Lab" }
      : specialtyView(user.specialty || user.extra) || { ar: "طبيب", en: "Doctor" },
    address: user.address
      ? { ar: user.address, en: user.address }
      : { ar: "غير محدد", en: "Not specified" },
    city: { ar: "غير محدد", en: "Not specified" },
    lat: user.location && Number.isFinite(user.location.lat) ? user.location.lat : null,
    lng: user.location && Number.isFinite(user.location.lng) ? user.location.lng : null,
    ...(user.role === "lab" ? { tests: labOfferedTests(user) } : {}),
    schedule: getSchedule(user),
    rating: r.avg || 0,
    ratingCount: r.count || 0,
    avatarV: user.avatarAt ? new Date(user.avatarAt).getTime() : 0,
  };
}

module.exports = { placeView };
