// بيانات تجريبية مؤقتة لحد ما الـ API والداتا بيز يجهزوا
const ago = (h) => new Date(Date.now() - h * 3600 * 1000).toISOString();

// كتالوج الفحوصات (kind: lab = تحليل، xray = أشعة)
export const TEST_CATALOG = [
  { ar: "HbA1c", en: "HbA1c", kind: "lab" },
  { ar: "صورة دم كاملة CBC", en: "Complete blood count (CBC)", kind: "lab" },
  { ar: "وظائف كلى", en: "Kidney function", kind: "lab" },
  { ar: "وظائف كبد", en: "Liver function", kind: "lab" },
  { ar: "أشعة سينية على الصدر", en: "Chest X-ray", kind: "xray" },
  { ar: "أشعة مقطعية على الصدر", en: "Chest CT", kind: "xray" },
  { ar: "موجات صوتية على البطن", en: "Abdominal ultrasound", kind: "xray" },
  { ar: "رنين مغناطيسي", en: "MRI", kind: "xray" },
];

// الشكل المتوقع للطلب من الـ API (sex: male | female) (status: new | progress | done)
export const MOCK_REQUESTS = [
  { id: 1041, name: "أحمد حسن", age: 45, sex: "male", phone: "01012345678", test: "HbA1c", kind: "lab", doctor: "د. أحمد سمير", status: "new", createdAt: ago(3) },
  { id: 1042, name: "فاطمة علي", age: 38, sex: "female", phone: "01123456789", test: "صورة دم كاملة CBC", kind: "lab", doctor: "د. سارة علي", status: "new", createdAt: ago(2) },
  { id: 1040, name: "محمود سعيد", age: 60, sex: "male", phone: "01234567890", test: "أشعة مقطعية على الصدر", kind: "xray", doctor: "د. سارة علي", status: "progress", createdAt: ago(20) },
  { id: 1039, name: "نورا إبراهيم", age: 29, sex: "female", phone: "01098765432", test: "موجات صوتية على البطن", kind: "xray", doctor: "د. مها خالد", status: "progress", createdAt: ago(26) },
  { id: 1038, name: "ياسر مصطفى", age: 51, sex: "male", phone: "01556781234", test: "وظائف كلى", kind: "lab", doctor: "د. أحمد سمير", status: "done", createdAt: ago(50), files: ["kidney.pdf"], uploadedAt: ago(44), notes: "" },
  { id: 1037, name: "هدى كمال", age: 52, sex: "female", phone: "01011223344", test: "أشعة سينية على الصدر", kind: "xray", doctor: "د. سارة علي", status: "done", createdAt: ago(75), files: ["chest.dcm", "chest.jpg"], uploadedAt: ago(70), notes: "" },
  { id: 1036, name: "سامي فؤاد", age: 33, sex: "male", phone: "01277788899", test: "وظائف كبد", kind: "lab", doctor: "د. مها خالد", status: "done", createdAt: ago(100), files: ["liver.pdf"], uploadedAt: ago(96), notes: "" },
  { id: 1035, name: "منى عادل", age: 41, sex: "female", phone: "01166655544", test: "رنين مغناطيسي", kind: "xray", doctor: "د. أحمد سمير", status: "done", createdAt: ago(130), files: ["mri.dcm"], uploadedAt: ago(121), notes: "" },
];

export const MOCK_PROFILE = {
  name: "معمل الأمل للتحاليل والأشعة",
  license: "LB-2019-4471",
  address: "٢٥ شارع الجلاء، المنصورة",
  phone: "0502345678",
  hours: [1, 1, 1, 1, 1, 1, 0].map((on) => ({ on: !!on, from: "08:00", to: "20:00" })),
  tests: TEST_CATALOG.map((t, i) => ({ name: t.ar, on: i !== 7 })),
};

export const fileType = (n) => {
  const x = n.split(".").pop().toLowerCase();
  return x === "pdf" ? "PDF" : x === "dcm" ? "DICOM" : "IMG";
};
