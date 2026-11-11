import { r, fail } from '../router.js';
import { bucket, save } from '../db.js';
import { patientOf } from '../helpers.js';
import { TEST_CATALOG } from '../../config/catalog.js';
import { clean, isEgPhone } from '../../api/security.js';

const empty = () => ({
  profile: { license: '', address: '', phone: '', hours: Array.from({ length: 7 }, (_, i) => ({ on: i < 6, from: '08:00', to: '20:00' })), tests: TEST_CATALOG.map((t) => ({ name: t.ar, on: true })) },
  requests: [],
});
const LB = ({ db, user }) => bucket('labs', user.id, empty) && db.labs[user.id];
const sortNew = (a) => [...a].sort((x, y) => new Date(y.createdAt) - new Date(x.createdAt));
const dayKey = (iso) => { const d = new Date(iso); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };

r.get('/lab/requests', (ctx) => {
  const s = ctx.query.status;
  return sortNew(LB(ctx).requests.filter((x) => !s || (s === 'pending' ? x.status !== 'done' : x.status === s)));
});
r.post('/lab/requests', (ctx) => {
  const b = ctx.body, L = LB(ctx);
  if (clean(b.name).length < 3 || !(b.age >= 0 && b.age <= 120) || !isEgPhone(b.phone) || !b.test) fail(400, 'invalid_data');
  const linked = ctx.db.users.find((u) => u.role === 'patient' && u.phone && u.phone === clean(b.phone, 20));
  const req = { id: Math.max(1000, ...L.requests.map((x) => x.id)) + 1, patientId: linked ? linked.id : null, name: clean(b.name, 80), sex: b.sex === 'female' ? 'female' : 'male', age: Number(b.age), phone: clean(b.phone, 20), test: clean(b.test, 80), kind: b.kind === 'xray' ? 'xray' : 'lab', doctor: null, status: 'new', createdAt: new Date().toISOString() };
  L.requests.unshift(req); save();
  return req;
});
r.patch('/lab/requests/:id/start', (ctx) => {
  const q = LB(ctx).requests.find((x) => String(x.id) === ctx.params.id); if (!q) fail(404, 'not_found');
  q.status = 'progress';
  const bk = q.bookingId && ctx.db.bookings.find((x) => x.id === q.bookingId); if (bk) bk.status = 'confirmed'; // المريض يشوف إن المعمل استلم طلبه
  save(); return q;
});
// رفع النتيجة: بتتربط بملف المريض (لو عنده حساب بنفس رقم الهاتف)
r.post('/lab/requests/:id/result', (ctx) => {
  const q = LB(ctx).requests.find((x) => String(x.id) === ctx.params.id); if (!q) fail(404, 'not_found');
  const files = ctx.body.files || []; if (!files.length) fail(400, 'invalid_data');
  Object.assign(q, { status: 'done', files: files.map((f) => f.name), notes: clean(ctx.body.notes, 1000), uploadedAt: new Date().toISOString() });
  const pu = ctx.db.users.find((u) => u.id === q.patientId) || ctx.db.users.find((u) => u.role === 'patient' && u.phone && u.phone === q.phone);
  if (pu) {
    const rec = patientOf(ctx.db, pu.id);
    rec.results.unshift({ id: `x_${q.id}`, kind: q.kind, title: q.test, source: ctx.user.name, date: q.uploadedAt, status: 'normal', fileUrl: files[0].dataUrl || '' });
    rec.permissions.log.unshift({ id: `l_${q.id}`, who: ctx.user.name, action: { ar: 'رفع نتيجة', en: 'Uploaded a result' }, at: q.uploadedAt });
  }
  const bk = q.bookingId && ctx.db.bookings.find((x) => x.id === q.bookingId); if (bk) bk.status = 'done';
  save(); return q;
});
r.get('/lab/results', (ctx) => {
  const name = String(ctx.query.name || '').trim().toLowerCase(), date = ctx.query.date || '';
  return LB(ctx).requests.filter((x) => x.status === 'done')
    .filter((x) => !name || x.name.toLowerCase().includes(name) || x.test.toLowerCase().includes(name))
    .filter((x) => !date || dayKey(x.uploadedAt) === date)
    .sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt));
});
r.get('/lab/results/dates', (ctx) => [...new Set(LB(ctx).requests.filter((x) => x.status === 'done').map((x) => dayKey(x.uploadedAt)))].sort().reverse());
r.get('/lab/profile', (ctx) => LB(ctx).profile);
r.put('/lab/profile', (ctx) => {
  const L = LB(ctx), b = ctx.body;
  if (typeof b.address !== 'undefined') L.profile.address = typeof b.address === 'object' ? b.address : clean(b.address, 150);
  if (typeof b.phone !== 'undefined') L.profile.phone = clean(b.phone, 20);
  if (Array.isArray(b.hours) && b.hours.length === 7) L.profile.hours = b.hours.map((h) => ({ on: !!h.on, from: String(h.from).slice(0, 5), to: String(h.to).slice(0, 5) }));
  if (Array.isArray(b.tests)) L.profile.tests = b.tests.map((t) => ({ name: clean(t.name, 80), on: !!t.on }));
  save(); return L.profile;
});
