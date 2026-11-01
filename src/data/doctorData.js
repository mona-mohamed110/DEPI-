// بيانات تجريبية ثنائية اللغة {ar, en} — استبدلها لاحقاً بالـ API الحقيقي
// الأوقات والتواريخ مخزنة بصيغة قياسية ('09:00' و '2026-12-31') وتُنسَّق حسب اللغة.

// المرضى الذين منحوا الطبيب إذن وصول ساري
export const patients = [
  {
    id: 10021, n: { ar: 'أحمد حسن', en: 'Ahmed Hassan' }, age: 45, exp: '2026-12-31',
    ch: { ar: 'السكر النوع ٢', en: 'Type 2 diabetes' }, al: { ar: 'البنسلين', en: 'Penicillin' },
    rx: { ar: 'ميتفورمين ٥٠٠ مجم، أملوديبين ٥ مجم', en: 'Metformin 500 mg, Amlodipine 5 mg' },
    res: { ar: 'HbA1c ٧.١٪ (٢٥ أكت)', en: 'HbA1c 7.1% (Oct 25)' },
  },
  {
    id: 10022, n: { ar: 'فاطمة علي', en: 'Fatma Ali' }, age: 38, exp: '2026-11-30',
    ch: { ar: 'ضغط الدم', en: 'Hypertension' }, al: { ar: 'لا يوجد', en: 'None' },
    rx: { ar: 'أملوديبين ٥ مجم', en: 'Amlodipine 5 mg' },
    res: { ar: 'تحليل كوليسترول طبيعي (١٨ أكت)', en: 'Normal cholesterol test (Oct 18)' },
  },
  {
    id: 10023, n: { ar: 'محمود سعيد', en: 'Mahmoud Saeed' }, age: 60, exp: '2026-12-15',
    ch: { ar: 'القلب والسكر', en: 'Heart disease & diabetes' }, al: { ar: 'الأسبرين', en: 'Aspirin' },
    rx: { ar: 'ميتفورمين ١٠٠٠ مجم، بيسوبرولول ٥ مجم', en: 'Metformin 1000 mg, Bisoprolol 5 mg' },
    res: { ar: 'ECG يحتاج متابعة (١ أكت)', en: 'ECG needs follow-up (Oct 1)' },
  },
];

// حالات الموعد: done | exam | wait | booked
export const appointments = [
  { id: 1, n: patients[0].n, time: '09:00', status: 'done' },
  { id: 2, n: patients[1].n, time: '09:30', status: 'exam' },
  { id: 3, n: patients[2].n, time: '10:00', status: 'wait' },
  { id: 4, n: patients[0].n, time: '10:30', status: 'booked' },
];

export const statusBadge = { done: 'ok', exam: '', wait: 'wn', booked: 'gr' };

// أنواع التحاليل والأشعة الافتراضية
export const defaultTests = [
  { key: 'fbs', ar: 'سكر صائم', en: 'Fasting blood sugar' },
  { key: 'hba1c', ar: 'HbA1c', en: 'HbA1c' },
  { key: 'cbc', ar: 'صورة دم CBC', en: 'CBC' },
  { key: 'kidney', ar: 'وظائف كلى', en: 'Kidney function' },
  { key: 'chest', ar: 'أشعة صدر', en: 'Chest X-ray' },
  { key: 'ecg', ar: 'رسم قلب', en: 'ECG' },
  { key: 'us', ar: 'موجات صوتية', en: 'Ultrasound' },
];

// هل يطابق الاسم (بأي لغة) نص البحث؟
export const matchesName = (n, q) => {
  const term = q.trim().toLowerCase();
  if (!term) return true;
  const names = typeof n === 'object' ? Object.values(n) : [n];
  return names.some((x) => x.toLowerCase().includes(term));
};
