// نفس كتالوج الواجهة (src/config/catalog.js) — حدّثهما معاً
// الاسم العربي هو المفتاح المحفوظ في قاعدة البيانات (نفس src/config/catalog.js — حدّثهما معاً)
const TEST_INFO = [
  { ar: "HbA1c", en: "HbA1c", kind: "lab" },
  { ar: "صورة دم كاملة CBC", en: "Complete blood count (CBC)", kind: "lab" },
  { ar: "وظائف كلى", en: "Kidney function", kind: "lab" },
  { ar: "وظائف كبد", en: "Liver function", kind: "lab" },
  { ar: "أشعة سينية على الصدر", en: "Chest X-ray", kind: "xray" },
  { ar: "أشعة مقطعية على الصدر", en: "Chest CT", kind: "xray" },
  { ar: "موجات صوتية على البطن", en: "Abdominal ultrasound", kind: "xray" },
  { ar: "رنين مغناطيسي", en: "MRI", kind: "xray" },
  { ar: "سكر صائم", en: "Fasting blood glucose", kind: "lab" },
  { ar: "صورة دهون (كوليسترول)", en: "Lipid profile (cholesterol)", kind: "lab" },
  { ar: "وظائف الغدة الدرقية (TSH)", en: "Thyroid function (TSH)", kind: "lab" },
  { ar: "تحليل بول كامل", en: "Complete urine analysis", kind: "lab" },
  { ar: "مزرعة بول", en: "Urine culture", kind: "lab" },
  { ar: "تحليل براز", en: "Stool analysis", kind: "lab" },
  { ar: "فيريتين وحديد", en: "Ferritin & iron", kind: "lab" },
  { ar: "فيتامين د", en: "Vitamin D", kind: "lab" },
  { ar: "فيتامين ب12", en: "Vitamin B12", kind: "lab" },
  { ar: "بروتين سي التفاعلي (CRP)", en: "C-reactive protein (CRP)", kind: "lab" },
  { ar: "سرعة الترسيب (ESR)", en: "ESR", kind: "lab" },
  { ar: "تروبونين (أنزيمات القلب)", en: "Troponin (cardiac enzymes)", kind: "lab" },
  { ar: "تحليل الحمل (بيتا HCG)", en: "Pregnancy test (beta-hCG)", kind: "lab" },
  { ar: "اختبار جرثومة المعدة (H. pylori)", en: "H. pylori test", kind: "lab" },
  { ar: "حمض اليوريك", en: "Uric acid", kind: "lab" },
  { ar: "العامل الروماتويدي (RF)", en: "Rheumatoid factor (RF)", kind: "lab" },
  { ar: "رسم قلب (ECG)", en: "ECG", kind: "xray" },
  { ar: "إيكو على القلب", en: "Echocardiogram", kind: "xray" },
  { ar: "أشعة سينية على الركبة", en: "Knee X-ray", kind: "xray" },
  { ar: "أشعة سينية على العمود الفقري", en: "Spine X-ray", kind: "xray" },
  { ar: "أشعة سينية على العظام", en: "Bone X-ray", kind: "xray" },
  { ar: "أشعة سينية على الجيوب الأنفية", en: "Sinus X-ray", kind: "xray" },
  { ar: "موجات صوتية على الحوض", en: "Pelvic ultrasound", kind: "xray" },
  { ar: "موجات صوتية على المسالك البولية", en: "Urinary tract ultrasound", kind: "xray" },
  { ar: "موجات صوتية على الغدة الدرقية", en: "Thyroid ultrasound", kind: "xray" },
  { ar: "موجات صوتية على الحمل", en: "Obstetric ultrasound", kind: "xray" },
  { ar: "رنين مغناطيسي على المخ", en: "Brain MRI", kind: "xray" },
  { ar: "أشعة مقطعية على المخ", en: "Brain CT", kind: "xray" },
  { ar: "رنين مغناطيسي على العمود الفقري", en: "Spine MRI", kind: "xray" },
];
const TEST_CATALOG = TEST_INFO.map((t) => t.ar);


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

// التخصصات (نفس قائمة الواجهة src/config/catalog.js — حدّثهما معاً)
const SPECIALTIES = [
  { id: "sp_internal", ar: "باطنة", en: "Internal medicine" },
  { id: "sp_endo", ar: "سكر وغدد صماء", en: "Diabetes & endocrinology" },
  { id: "sp_cardio", ar: "قلب وأوعية دموية", en: "Cardiology" },
  { id: "sp_chest", ar: "صدر وجهاز تنفسي", en: "Chest & respiratory" },
  { id: "sp_gastro", ar: "جهاز هضمي وكبد", en: "Gastroenterology & hepatology" },
  { id: "sp_nephro", ar: "كلى", en: "Nephrology" },
  { id: "sp_neuro", ar: "مخ وأعصاب", en: "Neurology" },
  { id: "sp_psych", ar: "طب نفسي", en: "Psychiatry" },
  { id: "sp_peds", ar: "أطفال", en: "Pediatrics" },
  { id: "sp_neonatal", ar: "حديثي الولادة", en: "Neonatology" },
  { id: "sp_obgyn", ar: "نساء وتوليد", en: "Obstetrics & gynecology" },
  { id: "sp_andrology", ar: "ذكورة وعقم", en: "Andrology & infertility" },
  { id: "sp_surgery", ar: "جراحة عامة", en: "General surgery" },
  { id: "sp_neurosurg", ar: "جراحة مخ وأعصاب", en: "Neurosurgery" },
  { id: "sp_cardiosurg", ar: "جراحة قلب وصدر", en: "Cardiothoracic surgery" },
  { id: "sp_vascular", ar: "جراحة أوعية دموية", en: "Vascular surgery" },
  { id: "sp_plastic", ar: "جراحة تجميل", en: "Plastic surgery" },
  { id: "sp_urology", ar: "مسالك بولية", en: "Urology" },
  { id: "sp_ortho", ar: "عظام", en: "Orthopedics" },
  { id: "sp_ent", ar: "أنف وأذن وحنجرة", en: "ENT" },
  { id: "sp_eye", ar: "عيون", en: "Ophthalmology" },
  { id: "sp_derm", ar: "جلدية وتناسلية", en: "Dermatology & venereology" },
  { id: "sp_dental", ar: "أسنان", en: "Dentistry" },
  { id: "sp_oncology", ar: "أورام", en: "Oncology" },
  { id: "sp_hematology", ar: "أمراض دم", en: "Hematology" },
  { id: "sp_rheum", ar: "روماتيزم", en: "Rheumatology" },
  { id: "sp_allergy", ar: "حساسية ومناعة", en: "Allergy & immunology" },
  { id: "sp_infectious", ar: "أمراض معدية", en: "Infectious diseases" },
  { id: "sp_geriatric", ar: "طب المسنين", en: "Geriatrics" },
  { id: "sp_physio", ar: "علاج طبيعي وتأهيل", en: "Physiotherapy & rehabilitation" },
  { id: "sp_radiology", ar: "أشعة تشخيصية", en: "Radiology" },
  { id: "sp_anesthesia", ar: "تخدير وعناية مركزة", en: "Anesthesia & intensive care" },
  { id: "sp_emergency", ar: "طوارئ", en: "Emergency medicine" },
  { id: "sp_family", ar: "طب أسرة", en: "Family medicine" },
  { id: "sp_nutrition", ar: "تغذية علاجية", en: "Clinical nutrition" },
  { id: "sp_pain", ar: "علاج الألم", en: "Pain management" },
  { id: "sp_other", ar: "أخرى", en: "Other" },
];

// قيمة التخصص المحفوظة (معرّف مثل sp_cardio) -> {ar, en}. القيم القديمة النصية تُرجع كما هي.
function specialtyView(value) {
  const v = String(value || "");
  if (!v) return "";
  const s = SPECIALTIES.find((x) => x.id === v);
  return s ? { ar: s.ar, en: s.en } : v;
}

// التحاليل التي يوفرها معمل: ما فعّله في ملفه، وإذا لم يضبط شيئاً بعد فكل الكتالوج
function labOfferedTests(user) {
  const lp = (user && user.labProfile) || {};
  if (lp.tests && lp.tests.length) return lp.tests.filter((t) => t.on).map((t) => t.name);
  return TEST_CATALOG.slice();
}

module.exports = { TEST_CATALOG, TEST_INFO, CHRONIC, SPECIALTIES, specialtyView, labOfferedTests };
