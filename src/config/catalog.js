// كتالوج أنواع التحاليل والأشعة (إعدادات ثابتة للمشروع، مش داتا وهمية)
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

// الأمراض المزمنة (قائمة الاختيار في التسجيل والملف الشخصي)
export const CHRONIC = [
  { id: 'diabetes', ar: 'السكري', en: 'Diabetes' },
  { id: 'hypertension', ar: 'ضغط الدم', en: 'Hypertension' },
  { id: 'heart', ar: 'أمراض القلب', en: 'Heart disease' },
  { id: 'asthma', ar: 'الربو', en: 'Asthma' },
  { id: 'kidney', ar: 'أمراض الكلى', en: 'Kidney disease' },
  { id: 'liver', ar: 'أمراض الكبد', en: 'Liver disease' },
  { id: 'thyroid', ar: 'الغدة الدرقية', en: 'Thyroid disorder' },
  { id: 'cholesterol', ar: 'ارتفاع الكوليسترول', en: 'High cholesterol' },
  { id: 'arthritis', ar: 'التهاب المفاصل', en: 'Arthritis' },
  { id: 'epilepsy', ar: 'الصرع', en: 'Epilepsy' },
];
export const BLOOD_TYPES = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

// التخصصات (مفتاح الترجمة + الاسم الثنائي اللغة اللي بيتخزن في الروشتة)
export const SPECIALTIES = [
  { id: 'sp_internal', ar: 'باطنة', en: 'Internal medicine' },
  { id: 'sp_cardio', ar: 'قلب', en: 'Cardiology' },
  { id: 'sp_neuro', ar: 'مخ وأعصاب', en: 'Neurology' },
  { id: 'sp_peds', ar: 'أطفال', en: 'Pediatrics' },
  { id: 'sp_derm', ar: 'جلدية', en: 'Dermatology' },
  { id: 'sp_ortho', ar: 'عظام', en: 'Orthopedics' },
];
export const VISIT_TYPES = ['new', 'followup', 'consult'];
