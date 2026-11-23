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
  { id: 'sp_endo', ar: 'سكر وغدد صماء', en: 'Diabetes & endocrinology' },
  { id: 'sp_cardio', ar: 'قلب وأوعية دموية', en: 'Cardiology' },
  { id: 'sp_chest', ar: 'صدر وجهاز تنفسي', en: 'Chest & respiratory' },
  { id: 'sp_gastro', ar: 'جهاز هضمي وكبد', en: 'Gastroenterology & hepatology' },
  { id: 'sp_nephro', ar: 'كلى', en: 'Nephrology' },
  { id: 'sp_neuro', ar: 'مخ وأعصاب', en: 'Neurology' },
  { id: 'sp_psych', ar: 'طب نفسي', en: 'Psychiatry' },
  { id: 'sp_peds', ar: 'أطفال', en: 'Pediatrics' },
  { id: 'sp_neonatal', ar: 'حديثي الولادة', en: 'Neonatology' },
  { id: 'sp_obgyn', ar: 'نساء وتوليد', en: 'Obstetrics & gynecology' },
  { id: 'sp_andrology', ar: 'ذكورة وعقم', en: 'Andrology & infertility' },
  { id: 'sp_surgery', ar: 'جراحة عامة', en: 'General surgery' },
  { id: 'sp_neurosurg', ar: 'جراحة مخ وأعصاب', en: 'Neurosurgery' },
  { id: 'sp_cardiosurg', ar: 'جراحة قلب وصدر', en: 'Cardiothoracic surgery' },
  { id: 'sp_vascular', ar: 'جراحة أوعية دموية', en: 'Vascular surgery' },
  { id: 'sp_plastic', ar: 'جراحة تجميل', en: 'Plastic surgery' },
  { id: 'sp_urology', ar: 'مسالك بولية', en: 'Urology' },
  { id: 'sp_ortho', ar: 'عظام', en: 'Orthopedics' },
  { id: 'sp_ent', ar: 'أنف وأذن وحنجرة', en: 'ENT' },
  { id: 'sp_eye', ar: 'عيون', en: 'Ophthalmology' },
  { id: 'sp_derm', ar: 'جلدية وتناسلية', en: 'Dermatology & venereology' },
  { id: 'sp_dental', ar: 'أسنان', en: 'Dentistry' },
  { id: 'sp_oncology', ar: 'أورام', en: 'Oncology' },
  { id: 'sp_hematology', ar: 'أمراض دم', en: 'Hematology' },
  { id: 'sp_rheum', ar: 'روماتيزم', en: 'Rheumatology' },
  { id: 'sp_allergy', ar: 'حساسية ومناعة', en: 'Allergy & immunology' },
  { id: 'sp_infectious', ar: 'أمراض معدية', en: 'Infectious diseases' },
  { id: 'sp_geriatric', ar: 'طب المسنين', en: 'Geriatrics' },
  { id: 'sp_physio', ar: 'علاج طبيعي وتأهيل', en: 'Physiotherapy & rehabilitation' },
  { id: 'sp_radiology', ar: 'أشعة تشخيصية', en: 'Radiology' },
  { id: 'sp_anesthesia', ar: 'تخدير وعناية مركزة', en: 'Anesthesia & intensive care' },
  { id: 'sp_emergency', ar: 'طوارئ', en: 'Emergency medicine' },
  { id: 'sp_family', ar: 'طب أسرة', en: 'Family medicine' },
  { id: 'sp_nutrition', ar: 'تغذية علاجية', en: 'Clinical nutrition' },
  { id: 'sp_pain', ar: 'علاج الألم', en: 'Pain management' },
  { id: 'sp_other', ar: 'أخرى', en: 'Other' },
];
// اسم التخصص باللغة الحالية (لو قيمة قديمة مش في القائمة بنرجعها زي ما هي)
export const specName = (id, lang) => { const s = SPECIALTIES.find((x) => x.id === id); return s ? (lang === 'ar' ? s.ar : s.en) : (id || ''); };
export const VISIT_TYPES = ['new', 'followup', 'consult'];
