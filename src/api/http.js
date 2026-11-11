// ===== عميل الـ API الوحيد في المشروع =====
// كل صفحات المشروع بتكلم السيرفر من هنا فقط. لو VITE_API_URL فاضي بيروح للـ mock تلقائياً.
import { API_URL, USE_MOCK, REQUEST_TIMEOUT, API_CREDENTIALS } from '../config/env.js';
import { getSession, clearSession, cleanDeep, checkFile } from './security.js';

export class ApiError extends Error {
  constructor(status, code, message) { super(message || code); this.status = status; this.code = code || 'error'; }
}

const qs = (o) => {
  const p = new URLSearchParams();
  Object.entries(o || {}).forEach(([k, v]) => { if (v !== undefined && v !== null && v !== '') p.set(k, v); });
  const s = p.toString();
  return s ? `?${s}` : '';
};

export async function request(path, { method = 'GET', body, query, form } = {}) {
  const url = path + qs(query);
  const session = getSession();

  if (USE_MOCK) {
    const { mockRequest } = await import('../mock/mockServer.js');
    return mockRequest(method, url, body, session);
  }

  const headers = { Accept: 'application/json', 'X-Requested-With': 'XMLHttpRequest' };
  if (session?.token) headers.Authorization = `Bearer ${session.token}`;
  let payload;
  if (form) payload = form;
  else if (body !== undefined) { headers['Content-Type'] = 'application/json'; payload = JSON.stringify(cleanDeep(body)); }

  const ctl = new AbortController();
  const timer = setTimeout(() => ctl.abort(), REQUEST_TIMEOUT);
  let res;
  try {
    res = await fetch(API_URL + url, { method, headers, body: payload, signal: ctl.signal, credentials: API_CREDENTIALS, cache: 'no-store' });
  } catch (e) {
    throw new ApiError(0, e.name === 'AbortError' ? 'timeout' : 'network');
  } finally { clearTimeout(timer); }

  let data = null;
  if (res.status !== 204) { try { data = await res.json(); } catch { data = null; } }
  if (!res.ok) {
    if (res.status === 401 && session) { clearSession(); window.dispatchEvent(new Event('shefaa:unauthorized')); }
    throw new ApiError(res.status, data?.code, data?.message);
  }
  return data;
}

export const api = {
  get: (p, query) => request(p, { query }),
  post: (p, body) => request(p, { method: 'POST', body }),
  put: (p, body) => request(p, { method: 'PUT', body }),
  patch: (p, body) => request(p, { method: 'PATCH', body }),
  del: (p, body) => request(p, { method: 'DELETE', body }),
};

const readAsDataUrl = (f) => new Promise((ok, no) => { const r = new FileReader(); r.onload = () => ok(r.result); r.onerror = no; r.readAsDataURL(f); });

// رفع ملفات: FormData للسيرفر الحقيقي، وبيانات خفيفة للـ mock
export async function upload(path, files, fields = {}, opts = {}) {
  const list = [].concat(files || []);
  for (const f of list) {
    const bad = checkFile(f, opts);
    if (bad) throw new ApiError(400, bad === 'size' ? 'file_too_big' : 'file_type');
  }
  if (USE_MOCK) {
    const meta = await Promise.all(list.map(async (f) => ({ name: f.name, size: f.size, type: f.type, dataUrl: f.size <= 1.2 * 1024 * 1024 ? await readAsDataUrl(f) : null })));
    return request(path, { method: 'POST', body: { ...fields, files: meta } });
  }
  const form = new FormData();
  list.forEach((f) => form.append('files', f));
  Object.entries(fields).forEach(([k, v]) => form.append(k, typeof v === 'object' ? JSON.stringify(v) : v ?? ''));
  return request(path, { method: 'POST', form });
}
