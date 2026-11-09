// ===== المصادقة: تسجيل دخول / تسجيل جديد / نسيت كلمة المرور =====
// Endpoints المتوقعة في الـ Backend:
//   POST /auth/login            {email,password}                 -> {token,user:{id,name,email,role,status}}
//   POST /auth/register         {role,fullName,email,phone,password,extra}
//   POST /auth/logout
//   GET  /auth/me               -> user
//   POST /auth/forgot-password  {email}                          -> يبعت كود على الإيميل
//   POST /auth/verify-code      {email,code}                     -> {resetToken}
//   POST /auth/reset-password   {email,resetToken,password}
//   POST /auth/change-password  {current,next}
import { api, upload, ApiError } from './http.js';
import { clearSession, getSession, isEmail, isStrongPassword, loginGuard, saveSession } from './security.js';

export async function login(email, password) {
  const mail = String(email || '').trim().toLowerCase();
  if (!isEmail(mail) || !password) throw new ApiError(400, 'invalid_credentials');
  const wait = loginGuard.remaining(mail);
  if (wait > 0) { const e = new ApiError(429, 'locked'); e.wait = wait; throw e; }
  try {
    const { token, user } = await api.post('/auth/login', { email: mail, password });
    loginGuard.reset(mail);
    saveSession({ token, user });
    return user;
  } catch (e) {
    if (e.code === 'invalid_credentials' || e.status === 401) loginGuard.fail(mail);
    throw e;
  }
}

// data.certificate = ملف الشهادة (صورة أو PDF) للطبيب والمعمل، و data.profile = بيانات المريض الصحية
export async function register(data) {
  if (!isEmail(data.email) || !isStrongPassword(data.password)) throw new ApiError(400, 'invalid_data');
  const { certificate, ...rest } = data;
  const body = { ...rest, email: data.email.trim().toLowerCase() };
  if (certificate) return upload('/auth/register', certificate, body, { maxBytes: 5 * 1024 * 1024, exts: ['pdf', 'png', 'jpg', 'jpeg', 'webp'] });
  return api.post('/auth/register', body);
}

export async function me() {
  const u = await api.get('/auth/me');
  const s = getSession();
  if (s) saveSession({ token: s.token, user: u });
  return u;
}

export async function logout() {
  try { await api.post('/auth/logout'); } catch { /* حتى لو فشل نمسح الجلسة محلياً */ }
  clearSession();
}

export const forgotPassword = (email) => api.post('/auth/forgot-password', { email: String(email).trim().toLowerCase() });
export const verifyCode = (email, code) => api.post('/auth/verify-code', { email: String(email).trim().toLowerCase(), code });
export const resetPassword = (email, resetToken, password) => api.post('/auth/reset-password', { email: String(email).trim().toLowerCase(), resetToken, password });
export const changePassword = (current, next) => api.post('/auth/change-password', { current, next });
