// ===== إعدادات المشروع (مكان واحد فقط) =====
// ضع رابط الـ API الحقيقي في ملف .env :  VITE_API_URL=https://api.example.com/api/v1
// لو الرابط فاضي → المشروع يشتغل تلقائياً على البيانات الوهمية الموجودة في src/mock
const raw = (import.meta.env.VITE_API_URL || '').trim().replace(/\/+$/, '');

export const API_URL = raw;
export const USE_MOCK = !raw || import.meta.env.VITE_USE_MOCK === 'true';
export const REQUEST_TIMEOUT = Number(import.meta.env.VITE_API_TIMEOUT) || 15000;
// same-origin (الافتراضي) أو include لو الـ API بيستخدم httpOnly cookies على دومين تاني
export const API_CREDENTIALS = import.meta.env.VITE_API_CREDENTIALS || 'same-origin';
// لو true: الطبيب والمعمل لازم الأدمن يعتمد الترخيص قبل ما يقدروا يدخلوا
export const REQUIRE_LICENSE_APPROVAL = import.meta.env.VITE_REQUIRE_LICENSE_APPROVAL === 'true';
// مدة الجلسة بالمللي ثانية (الافتراضي 8 ساعات) — السيرفر هو اللي بيفرض المدة الحقيقية
export const SESSION_TTL = Number(import.meta.env.VITE_SESSION_TTL) || 8 * 3600 * 1000;

export const ROLES = ['patient', 'doctor', 'lab', 'reception', 'admin'];
export const ROLE_HOME = { patient: '/patient', doctor: '/doctor', lab: '/lab', reception: '/reception', admin: '/admin' };

if (USE_MOCK && import.meta.env.PROD) {
  console.warn('[Shefaa] الموقع شغال على بيانات وهمية. حدّد VITE_API_URL قبل النشر.');
}
