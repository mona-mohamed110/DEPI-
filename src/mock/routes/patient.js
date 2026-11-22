import { r, fail } from '../router.js';
import { save, uid, ageFrom, chronicFromIds, chronicToIds, patientOf, place, hasStaff, todayKey, grantDoctor } from '../helpers.js';
import { clean } from '../../api/security.js';

const P = ({ db, user }) => patientOf(db, user.id);
const byDate = (k) => (a, b) => new Date(b[k]) - new Date(a[k]);
const nowIso = () => new Date().toISOString();
const isDate = (s) => /^\d{4}-\d{2}-\d{2}$/.test(String(s || ''));
const validBirth = (s) => isDate(s) && new Date(s) < new Date() && new Date(s).getFullYear() > 1900;

const infoView = (p) => ({ ...p.info, age: ageFrom(p.info.birthDate) });
const appt = (db, b) => {
  const pl = place(db, b.providerId);
  return { id: b.id, kind: b.kind, providerId: b.providerId, doctor: pl?.name || '', specialty: pl?.specialty || '', date: b.date, time: b.time, status: b.status, test: b.test || null };
};
const mine = (ctx) => ctx.db.bookings.filter((b) => b.patientId === ctx.user.id);

r.get('/patient/dashboard', (ctx) => {
  const p = P(ctx), today = todayKey();
  const upcoming = mine(ctx).filter((b) => ['pending', 'confirmed'].includes(b.status) && b.date >= today)
    .sort((a, b) => `${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`)).map((b) => appt(ctx.db, b));
  const rx = [...p.prescriptions].sort(byDate('date'));
  const cur = rx.filter((x) => x.current);
  const activePerms = p.permissions.active.filter((g) => !g.until || g.until >= today);
  return {
    next: upcoming[0] || null, upcoming: upcoming.slice(0, 3),
    rxCount: cur.length, permCount: activePerms.length,
    latestRx: rx[0] ? { doctor: rx[0].doctor, date: rx[0].date, meds: rx[0].items.slice(0, 3).map((i) => i.name) } : null,
    alerts: [...p.results].sort(byDate('date')).slice(0, 2).map((x) => ({ kind: 'result', title: x.title })),
  };
});

r.get('/patient/profile', (ctx) => ({ ...infoView(P(ctx)), chronic: P(ctx).chronic, chronicIds: chronicToIds(P(ctx).chronic) }));
r.put('/patient/profile', (ctx) => {
  const b = ctx.body, p = P(ctx);
  if (b.birthDate !== undefined) { if (!validBirth(b.birthDate)) fail(400, 'invalid_data'); p.info.birthDate = b.birthDate; }
  if (b.blood !== undefined) p.info.blood = String(b.blood).slice(0, 4);
  if (b.height !== undefined) p.info.height = Number(b.height) || 0;
  if (b.weight !== undefined) p.info.weight = Number(b.weight) || 0;
  if (Array.isArray(b.chronicIds)) p.chronic = chronicFromIds(b.chronicIds);
  save();
  return { ...infoView(p), chronic: p.chronic, chronicIds: chronicToIds(p.chronic) };
});

r.get('/patient/medical-file', (ctx) => { const p = P(ctx); return { info: infoView(p), chronic: p.chronic, history: [...p.history].sort((a, b) => String(b.date).localeCompare(String(a.date))), reports: [...p.reports].sort(byDate('date')) }; });

// ---- التاريخ المرضي: إضافة وتعديل ----
const histBody = (b) => {
  const condition = clean(b.condition, 120);
  if (condition.length < 2) fail(400, 'invalid_data');
  if (b.date && !isDate(b.date)) fail(400, 'invalid_data');
  return { condition, date: b.date || '', notes: clean(b.notes, 500) };
};
r.post('/patient/history', (ctx) => { const h = { id: uid('h'), ...histBody(ctx.body) }; P(ctx).history.unshift(h); save(); return h; });
r.put('/patient/history/:id', (ctx) => {
  const h = P(ctx).history.find((x) => x.id === ctx.params.id); if (!h) fail(404, 'not_found');
  Object.assign(h, histBody(ctx.body)); save(); return h;
});

r.post('/patient/reports', (ctx) => {
  const p = P(ctx);
  const added = (ctx.body.files || []).map((f) => ({ id: uid('r'), name: f.name, type: f.type === 'application/pdf' ? 'pdf' : 'image', size: f.size, date: nowIso(), url: f.dataUrl || '' }));
  p.reports.unshift(...added); save();
  return added;
});
r.del('/patient/reports/:id', (ctx) => { const p = P(ctx); p.reports = p.reports.filter((x) => x.id !== ctx.params.id); save(); return null; });

// ---- الروشتات ----
r.get('/patient/prescriptions', (ctx) => P(ctx).prescriptions.filter((x) => (ctx.query.current === 'false' ? !x.current : x.current)).sort(byDate('date')));
r.patch('/patient/prescriptions/:id', (ctx) => {
  const x = P(ctx).prescriptions.find((y) => y.id === ctx.params.id); if (!x) fail(404, 'not_found');
  if (typeof ctx.body.current !== 'boolean') fail(400, 'invalid_data');
  x.current = ctx.body.current; save(); return x;
});
r.get('/patient/results', (ctx) => [...P(ctx).results].sort(byDate('date')));

// فرز الأعراض (تجريبي بالكلمات المفتاحية — استبدله بخدمة الذكاء الاصطناعي)
r.post('/patient/triage', ({ body, db }) => {
  const s = String(body.text || '').toLowerCase();
  if (s.trim().length < 2) fail(400, 'invalid_data');
  const has = (...w) => w.some((x) => s.includes(x));
  let likely = 'sym_l_general', severity = 'low', kind = 'باطنة';
  if (has('صدر', 'chest', 'قلب', 'heart')) { likely = 'sym_l_chest'; severity = 'high'; kind = 'قلب'; }
  else if (has('صداع', 'دوخة', 'headache', 'dizz')) { likely = 'sym_l_head'; severity = 'medium'; kind = 'مخ'; }
  else if (has('حرارة', 'كحة', 'fever', 'cough')) { likely = 'sym_l_flu'; severity = 'low'; kind = 'باطنة'; }
  const doctors = db.places.filter((p) => p.type === 'doctor').filter((p) => p.specialty.ar.includes(kind) || p.specialty.ar.includes('باطنة')).slice(0, 2);
  return { likely, severity, doctors };
});

// ---- المواعيد = حجوزات (دكتور: طلب لموظف الاستقبال / معمل: طلب للمعمل) ----
r.get('/patient/appointments', (ctx) => mine(ctx).sort((a, b) => `${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`)).map((b) => appt(ctx.db, b)));
r.post('/patient/appointments', (ctx) => {
  const { doctorId, date, time, test } = ctx.body, { db, user } = ctx;
  const pl = place(db, doctorId);
  if (!pl || !isDate(date) || !/^\d{2}:\d{2}$/.test(time)) fail(400, 'invalid_data');
  if (new Date(`${date}T${time}:00`) < new Date()) fail(400, 'past_date');
  if (db.bookings.some((b) => b.providerId === doctorId && b.date === date && b.time === time && ['pending', 'confirmed'].includes(b.status))) fail(409, 'slot_taken');
  const b = { id: uid('b'), kind: pl.type, providerId: doctorId, patientId: user.id, patientName: user.name, phone: user.phone || '', date, time, source: 'app', queue: 'not-arrived', createdAt: nowIso(),
    // الدكتور اللي معاه موظف استقبال: الطلب بيستنى قبوله. غير كده بيتأكد تلقائياً
    status: pl.type === 'doctor' && hasStaff(db, doctorId) ? 'pending' : 'confirmed' };
  if (pl.type === 'lab') {
    const lab = db.labs[doctorId];
    const tn = clean(test, 80);
    if (!lab || !tn) fail(400, 'invalid_data');
    b.test = tn; b.status = 'pending';
    const age = ageFrom(patientOf(db, user.id).info.birthDate);
    lab.requests.unshift({ id: Math.max(1000, ...lab.requests.map((x) => x.id)) + 1, name: typeof user.name === 'object' ? user.name.ar : user.name, patientId: user.id, age: age ?? 0, sex: 'male', phone: user.phone || '', test: tn, kind: /أشعة|رنين|موجات/.test(tn) ? 'xray' : 'lab', doctor: null, status: 'new', bookingId: b.id, date, time, createdAt: nowIso() });
  } else if (b.status === 'confirmed') {
    // ربط: تأكيد تلقائي = إذن للدكتور
    grantDoctor(db, user.id, doctorId);
  }
  db.bookings.push(b); save();
  return appt(db, b);
});
r.patch('/patient/appointments/:id', (ctx) => {
  const b = mine(ctx).find((x) => x.id === ctx.params.id); if (!b) fail(404, 'not_found');
  const { date, time } = ctx.body;
  if (!isDate(date) || !/^\d{2}:\d{2}$/.test(time)) fail(400, 'invalid_data');
  if (new Date(`${date}T${time}:00`) < new Date()) fail(400, 'past_date');
  b.date = date; b.time = time;
  if (b.kind === 'doctor' && hasStaff(ctx.db, b.providerId)) b.status = 'pending'; // التعديل = طلب جديد لموظف الاستقبال
  save(); return appt(ctx.db, b);
});
r.del('/patient/appointments/:id', (ctx) => {
  const b = mine(ctx).find((x) => x.id === ctx.params.id); if (!b) fail(404, 'not_found');
  ctx.db.bookings = ctx.db.bookings.filter((x) => x.id !== b.id);
  const lab = b.kind === 'lab' && ctx.db.labs[b.providerId];
  if (lab) lab.requests = lab.requests.filter((x) => !(x.bookingId === b.id && x.status === 'new'));
  save(); return null;
});

// ---- الأذونات (النشطة + سجل الوصول) ----
r.get('/patient/permissions/active', (ctx) => P(ctx).permissions.active.filter((g) => !g.until || g.until >= todayKey()));
r.del('/patient/permissions/active/:id', (ctx) => {
  const pm = P(ctx).permissions, g = pm.active.find((x) => x.id === ctx.params.id); if (!g) fail(404, 'not_found');
  pm.active = pm.active.filter((x) => x.id !== g.id);
  pm.log.unshift({ id: uid('l'), who: g.grantee, action: { ar: 'تم سحب إذن الوصول', en: 'Access was revoked' }, at: nowIso() });
  save(); return null;
});
r.del('/patient/permissions/active', (ctx) => {
  const pm = P(ctx).permissions;
  pm.log.unshift({ id: uid('l'), who: { ar: 'أنت', en: 'You' }, action: { ar: 'سحبت كل الأذونات', en: 'Revoked all permissions' }, at: nowIso() });
  pm.active = []; save(); return null;
});
r.get('/patient/permissions/log', (ctx) => [...P(ctx).permissions.log].sort(byDate('at')));
