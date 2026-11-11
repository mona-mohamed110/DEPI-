// ===== أدوات الأمان المشتركة =====
// ملاحظة: الفحص في المتصفح لتحسين تجربة المستخدم فقط، والسيرفر لازم يعيد كل الفحوصات.
import { SESSION_TTL } from '../config/env.js';

export const EMAIL_RE = /^[^\s@<>()]{1,64}@[^\s@<>()]{1,190}\.[^\s@<>()]{2,}$/;
export const isEmail = (v) => EMAIL_RE.test(String(v || '').trim());
export const isEgPhone = (v) => /^(\+?20|0)?1[0125]\d{8}$/.test(String(v || '').replace(/[\s-]/g, ''));
// كلمة المرور: ٨ حروف على الأقل وفيها حرف ورقم
export const isStrongPassword = (v) => typeof v === 'string' && v.length >= 8 && /[A-Za-z\u0600-\u06FF]/.test(v) && /\d/.test(v);

// تنظيف النصوص: بيشيل الرموز الخطرة وحروف التحكم ويقص الطول
export const clean = (s, max = 500) =>
  String(s ?? '').replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '').replace(/[<>]/g, '').trim().slice(0, max);

const SKIP = /pass|token|dataUrl/i; // الحقول دي مبتتعدلش
export function cleanDeep(v, depth = 0) {
  if (depth > 6) return v;
  if (typeof v === 'string') return clean(v, 5000);
  if (Array.isArray(v)) return v.map((x) => cleanDeep(x, depth + 1));
  if (v && typeof v === 'object' && !(v instanceof FormData) && !(v instanceof Blob)) {
    const o = {};
    for (const k of Object.keys(v)) o[k] = SKIP.test(k) ? v[k] : cleanDeep(v[k], depth + 1);
    return o;
  }
  return v;
}

// السماح بروابط http/https وصور data فقط
export const safeUrl = (u) => (/^(https?:|data:image\/|data:application\/pdf|blob:|\/)/i.test(String(u || '')) ? u : '');

// ===== رفع الملفات =====
export const UPLOAD_RULES = { maxBytes: 10 * 1024 * 1024, exts: ['pdf', 'png', 'jpg', 'jpeg', 'webp', 'dcm'] };
export function checkFile(f, { maxBytes = UPLOAD_RULES.maxBytes, exts = UPLOAD_RULES.exts } = {}) {
  const ext = String(f.name).split('.').pop().toLowerCase();
  if (!exts.includes(ext)) return 'type';
  if (f.size > maxBytes) return 'size';
  return null;
}

// ===== الجلسة (sessionStorage: بتتمسح بقفل التبويب) =====
// الأفضل في الإنتاج: السيرفر يرجع التوكن في httpOnly cookie ومنخزنوش هنا.
const KEY = 'shefaa_session';
export function getSession() {
  try {
    const s = JSON.parse(sessionStorage.getItem(KEY));
    if (!s || !s.user || (s.exp && s.exp < Date.now())) { sessionStorage.removeItem(KEY); return null; }
    return s;
  } catch { return null; }
}
export function saveSession({ token, user }) {
  try { sessionStorage.setItem(KEY, JSON.stringify({ token, user, exp: Date.now() + SESSION_TTL })); } catch { /* ignore */ }
}
export function patchSessionUser(patch) {
  const s = getSession();
  if (s) saveSession({ token: s.token, user: { ...s.user, ...patch } });
}
export function clearSession() { try { sessionStorage.removeItem(KEY); } catch { /* ignore */ } }

// ===== حماية من تخمين كلمة المرور (واجهة فقط) =====
const LOCK_KEY = 'shefaa_login_guard';
const MAX_TRIES = 5, LOCK_MS = 60 * 1000;
const readGuard = () => { try { return JSON.parse(sessionStorage.getItem(LOCK_KEY)) || {}; } catch { return {}; } };
const writeGuard = (g) => { try { sessionStorage.setItem(LOCK_KEY, JSON.stringify(g)); } catch { /* ignore */ } };
export const loginGuard = {
  remaining(email) {
    const g = readGuard()[String(email).toLowerCase()];
    return g && g.until > Date.now() ? Math.ceil((g.until - Date.now()) / 1000) : 0;
  },
  fail(email) {
    const all = readGuard(), k = String(email).toLowerCase();
    const g = all[k] || { n: 0 };
    g.n = (g.n || 0) + 1;
    if (g.n >= MAX_TRIES) { g.until = Date.now() + LOCK_MS; g.n = 0; }
    all[k] = g; writeGuard(all);
  },
  reset(email) { const all = readGuard(); delete all[String(email).toLowerCase()]; writeGuard(all); },
};

export async function sha256(text) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
}
