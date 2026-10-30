// خدمة الـ API الخاصة بلوحة المعمل.
// - لو مفيش VITE_API_URL في ملف .env بيشتغل على بيانات تجريبية (محفوظة في localStorage).
// - أول ما تحط VITE_API_URL=https://your-api.com/api هيتحول تلقائياً للـ API الحقيقي.
//
// الـ Endpoints المتوقعة:
//   GET   /lab/requests?status=new|progress|done|pending   -> [request]
//   GET   /lab/requests/:id                                -> request
//   POST  /lab/requests            {name,sex,age,phone,test,kind}      -> request
//   PATCH /lab/requests/:id/start                          -> request (status: progress)
//   POST  /lab/requests/:id/result (FormData: files[], notes) -> request (status: done)
//   GET   /lab/results?name=&date=YYYY-MM-DD               -> [request done]
//   GET   /lab/results/dates                               -> ["YYYY-MM-DD", ...]
//   GET   /lab/profile  |  PUT /lab/profile
//   GET   /lab/me  |  PUT /lab/me   |  POST /auth/change-password
import { MOCK_REQUESTS, MOCK_PROFILE } from "../data/labData";

const BASE_URL = (import.meta.env.VITE_API_URL || "").replace(/\/$/, "");
export const USE_MOCK = !BASE_URL;

const wait = (ms = 250) => new Promise((r) => setTimeout(r, ms));
const store = {
  get(k, d) { try { const s = localStorage.getItem(k); return s ? JSON.parse(s) : d; } catch { return d; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* ignore */ } },
};

async function http(path, { method = "GET", body, form } = {}) {
  const token = localStorage.getItem("token");
  const headers = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  if (body) headers["Content-Type"] = "application/json";
  const res = await fetch(BASE_URL + path, { method, headers, body: form || (body ? JSON.stringify(body) : undefined) });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.status === 204 ? null : res.json();
}

// يحول التاريخ ليوم محلي بصيغة YYYY-MM-DD
export const dayKey = (iso) => {
  const d = new Date(iso);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

const db = () => store.get("lab_requests", MOCK_REQUESTS);
const sortNew = (a) => [...a].sort((x, y) => new Date(y.createdAt) - new Date(x.createdAt));

/* ---------------- الطلبات ---------------- */
export async function getRequests({ status } = {}) {
  if (!USE_MOCK) return http(`/lab/requests${status ? `?status=${status}` : ""}`);
  await wait();
  return sortNew(db().filter((r) => !status || (status === "pending" ? r.status !== "done" : r.status === status)));
}

export async function createRequest(data) {
  if (!USE_MOCK) return http("/lab/requests", { method: "POST", body: data });
  await wait();
  const all = db();
  const r = { ...data, id: Math.max(1000, ...all.map((x) => x.id)) + 1, doctor: null, status: "new", createdAt: new Date().toISOString() };
  store.set("lab_requests", [r, ...all]);
  return r;
}

export async function startRequest(id) {
  if (!USE_MOCK) return http(`/lab/requests/${id}/start`, { method: "PATCH" });
  await wait(150);
  const all = db().map((r) => (r.id == id ? { ...r, status: "progress" } : r));
  store.set("lab_requests", all);
  return all.find((r) => r.id == id);
}

export async function uploadResult(id, { files, notes }) {
  if (!USE_MOCK) {
    const form = new FormData();
    files.forEach((f) => form.append("files", f));
    form.append("notes", notes || "");
    return http(`/lab/requests/${id}/result`, { method: "POST", form });
  }
  await wait(400);
  const all = db().map((r) => (r.id == id ? { ...r, status: "done", files: files.map((f) => f.name), notes, uploadedAt: new Date().toISOString() } : r));
  store.set("lab_requests", all);
  return all.find((r) => r.id == id);
}

/* ---------------- سجل النتائج (فلترة بالاسم واليوم) ---------------- */
export async function getResults({ name = "", date = "" } = {}) {
  if (!USE_MOCK) return http(`/lab/results?name=${encodeURIComponent(name)}&date=${date}`);
  await wait(150);
  const q = name.trim().toLowerCase();
  return db()
    .filter((r) => r.status === "done")
    .filter((r) => !q || r.name.toLowerCase().includes(q) || r.test.toLowerCase().includes(q))
    .filter((r) => !date || dayKey(r.uploadedAt) === date)
    .sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt));
}

export async function getResultDates() {
  if (!USE_MOCK) return http("/lab/results/dates");
  await wait(100);
  return [...new Set(db().filter((r) => r.status === "done").map((r) => dayKey(r.uploadedAt)))].sort().reverse();
}

/* ---------------- ملف المعمل / الحساب ---------------- */
export async function getLabProfile() {
  if (!USE_MOCK) return http("/lab/profile");
  await wait(150);
  return store.get("lab_profile", MOCK_PROFILE);
}
export async function updateLabProfile(p) {
  if (!USE_MOCK) return http("/lab/profile", { method: "PUT", body: p });
  await wait(250);
  store.set("lab_profile", p);
  return p;
}
export async function getMe() {
  if (!USE_MOCK) return http("/lab/me");
  await wait(100);
  return store.get("lab_me", { name: "موظف المعمل", email: "lab@shefaa.com", phone: "01000000000", notifNew: true, notifSms: false });
}
export async function updateMe(m) {
  if (!USE_MOCK) return http("/lab/me", { method: "PUT", body: m });
  await wait(250);
  store.set("lab_me", m);
  return m;
}
export async function changePassword(current, next) {
  if (!USE_MOCK) return http("/auth/change-password", { method: "POST", body: { current, next } });
  await wait(300);
  return { ok: true };
}
