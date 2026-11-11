// ======================================================================
//  سيرفر وهمي (للاختبار فقط) — بيحاكي الـ REST API بنفس شكل الـ endpoints الحقيقية.
//  مش بيتحمل لو VITE_API_URL متحدد. اللي هيبني الـ Backend يقرأ الـ endpoints من
//  ملفات src/api/*.js وكل ملف في src/mock/routes هو "عقد" الاستجابة المتوقعة.
// ======================================================================
import { getDb } from './db.js';
import { table, MockError } from './router.js';
import './routes/auth.js';
import './routes/patient.js';
import './routes/doctor.js';
import './routes/lab.js';
import './routes/reception.js';
import './routes/admin.js';
import { ApiError } from '../api/http.js';
import { cleanDeep } from '../api/security.js';

const AREA = { '/patient': 'patient', '/doctor': 'doctor', '/lab': 'lab', '/reception': 'reception', '/admin': 'admin' };
const wait = (ms) => new Promise((ok) => setTimeout(ok, ms));
const clone = (v) => (v === undefined || v === null ? null : JSON.parse(JSON.stringify(v)));

export async function mockRequest(method, url, body, session) {
  await wait(120 + Math.random() * 120);
  const db = getDb();
  const [path, search = ''] = url.split('?');
  const query = Object.fromEntries(new URLSearchParams(search));
  const route = table.find((r) => r.method === method && r.re.test(path));
  if (!route) throw new ApiError(404, 'not_found');
  const params = {};
  const m = route.re.exec(path);
  route.keys.forEach((k, i) => { params[k] = decodeURIComponent(m[i + 1]); });

  // ===== التحقق من الجلسة والصلاحية (في السيرفر الحقيقي ده بيحصل هناك) =====
  let user = null;
  if (!route.open) {
    const s = session?.token && db.sessions[session.token];
    user = s && db.users.find((u) => u.id === s.userId);
    if (!user) throw new ApiError(401, 'unauthorized');
    if (user.status === 'disabled') throw new ApiError(403, 'account_disabled');
    const area = Object.keys(AREA).find((p) => path.startsWith(p));
    if (area && AREA[area] !== user.role) throw new ApiError(403, 'forbidden');
  }
  try {
    const data = await route.handler({ params, query, body: cleanDeep(body || {}), user, db, session });
    return clone(data);
  } catch (e) {
    if (e instanceof MockError) throw new ApiError(e.status, e.code);
    throw e;
  }
}
