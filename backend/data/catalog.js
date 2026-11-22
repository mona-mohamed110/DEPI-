// نفس كتالوج الواجهة (src/config/catalog.js) — حدّثهما معاً
const TEST_CATALOG = [
  "HbA1c",
  "صورة دم كاملة CBC",
  "وظائف كلى",
  "وظائف كبد",
  "أشعة سينية على الصدر",
  "أشعة مقطعية على الصدر",
  "موجات صوتية على البطن",
  "رنين مغناطيسي",
];

const CHRONIC = [
  { id: "diabetes", ar: "السكري", en: "Diabetes" },
  { id: "hypertension", ar: "ضغط الدم", en: "Hypertension" },
  { id: "heart", ar: "أمراض القلب", en: "Heart disease" },
  { id: "asthma", ar: "الربو", en: "Asthma" },
  { id: "kidney", ar: "أمراض الكلى", en: "Kidney disease" },
  { id: "liver", ar: "أمراض الكبد", en: "Liver disease" },
  { id: "thyroid", ar: "الغدة الدرقية", en: "Thyroid disorder" },
  { id: "cholesterol", ar: "ارتفاع الكوليسترول", en: "High cholesterol" },
  { id: "arthritis", ar: "التهاب المفاصل", en: "Arthritis" },
  { id: "epilepsy", ar: "الصرع", en: "Epilepsy" },
];

module.exports = { TEST_CATALOG, CHRONIC };
