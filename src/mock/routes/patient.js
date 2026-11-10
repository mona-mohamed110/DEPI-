import { r, fail } from '../router.js';
import { save, uid, ageFrom, chronicFromIds, chronicToIds, patientOf, place, hasStaff, todayKey, addDays, grantDoctor, userName, awaitingItems, orderState } from '../helpers.js';
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
    alerts: [
      ...(awaitingItems(ctx.db, ctx.user.id) ? [{ kind: 'labs', n: awaitingItems(ctx.db, ctx.user.id) }] : []),
      ...[...p.results].sort(byDate('date')).slice(0, 2).map((x) => ({ kind: 'result', title: x.title })),
    ],
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
    const lab = ensureLab(db, pl);
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
  const lab = b.kind === 'lab' && ctx.db.labs[b.providerId];
  if (lab && b.orderId) {
    // الإلغاء ممكن بس قبل ما المعمل يبدأ. التحاليل ترجع "بانتظار المعمل" والمريض يختار معمل تاني
    const mine2 = lab.requests.filter((x) => x.bookingId === b.id);
    if (mine2.some((x) => x.status !== 'new')) fail(409, 'order_started');
    const order = ctx.db.labOrders.find((o) => o.id === b.orderId);
    mine2.forEach((x) => { const it = order?.items.find((i) => i.id === x.itemId); if (it) { it.status = 'awaiting_lab'; it.labId = null; it.bookingId = null; } });
    if (order) order.status = orderState(order);
  }
  if (lab) lab.requests = lab.requests.filter((x) => !(x.bookingId === b.id && x.status === 'new'));
  ctx.db.bookings = ctx.db.bookings.filter((x) => x.id !== b.id);
  save(); return null;
});

// ---- التحاليل المطلوبة (الدكتور يكتبها، والمريض يختار المعمل ويحجز) ----
const ensureLab = (db, pl) => (db.labs[pl.id] ||= { profile: { license: '', address: pl.address, phone: '', hours: Array.from({ length: 7 }, () => ({ on: true, from: '08:00', to: '20:00' })), tests: [] }, requests: [] });
const orderView = (db, o) => ({
  id: o.id, doctor: o.doctor, specialty: o.specialty, createdAt: o.createdAt, status: o.status,
  items: o.items.map((i) => ({ id: i.id, name: i.name, kind: i.kind, status: i.status, labId: i.labId, lab: i.labId ? place(db, i.labId)?.name || '' : null, bookingId: i.bookingId })),
});
// status=open (الافتراضي): الطلبات اللي فيها تحليل لسه ما خلصش | all: كل الطلبات
r.get('/patient/lab-orders', (ctx) => {
  const all = ctx.db.labOrders.filter((o) => o.patientId === ctx.user.id);
  const list = ctx.query.status === 'all' ? all : all.filter((o) => o.items.some((i) => i.status !== 'done'));
  return list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).map((o) => orderView(ctx.db, o));
});
// اختيار المعمل: المريض يحجز كل التحاليل (أو جزء منها) عند معمل. وممكن يكرر لباقي التحاليل عند معمل تاني
// itemIds اختياري: لو مش موجود = كل التحاليل اللي لسه ما اتحجزتش
r.post('/patient/lab-orders/:id/assign', (ctx) => {
  const { db, user } = ctx, { labId, date, time } = ctx.body;
  const order = db.labOrders.find((o) => o.id === ctx.params.id && o.patientId === user.id);
  if (!order) fail(404, 'not_found');
  const wanted = Array.isArray(ctx.body.itemIds) && ctx.body.itemIds.length ? ctx.body.itemIds : order.items.filter((i) => i.status === 'awaiting_lab').map((i) => i.id);
  const items = wanted.map((id) => order.items.find((i) => i.id === id));
  if (!items.length || items.some((i) => !i)) fail(400, 'invalid_data');
  if (items.some((i) => i.status !== 'awaiting_lab')) fail(409, 'order_assigned');
  const pl = place(db, labId);
  if (!pl || pl.type !== 'lab' || !isDate(date) || !/^\d{2}:\d{2}$/.test(time)) fail(400, 'invalid_data');
  if (new Date(`${date}T${time}:00`) < new Date()) fail(400, 'past_date');
  const lab = ensureLab(db, pl);
  const b = { id: uid('b'), kind: 'lab', providerId: labId, patientId: user.id, patientName: user.name, phone: user.phone || '', date, time, status: 'pending', queue: 'not-arrived', source: 'app', orderId: order.id, itemIds: items.map((i) => i.id), test: items.map((i) => i.name).join('، '), createdAt: nowIso() };
  db.bookings.push(b);
  const age = ageFrom(patientOf(db, user.id).info.birthDate);
  let next = Math.max(1000, ...lab.requests.map((x) => x.id));
  items.forEach((it) => {
    next += 1;
    lab.requests.unshift({ id: next, name: typeof user.name === 'object' ? user.name.ar : user.name, patientId: user.id, age: age ?? 0, sex: 'male', phone: user.phone || '', test: it.name, kind: it.kind, doctor: order.doctor, status: 'new', bookingId: b.id, orderId: order.id, itemId: it.id, date, time, createdAt: nowIso() });
    it.status = 'assigned'; it.labId = labId; it.bookingId = b.id;
  });
  order.status = orderState(order);
  const pm = patientOf(db, user.id).permissions, until = addDays(30);
  const ex = pm.active.find((g) => g.granteeId === labId);
  if (ex) ex.until = until;
  else pm.active.push({ id: uid('g'), granteeId: labId, grantee: userName(db, labId) || pl.name, kind: 'lab', scope: { ar: 'التحاليل المطلوبة فقط', en: 'Requested tests only' }, until });
  pm.log.unshift({ id: uid('l'), who: pl.name, action: { ar: 'تم منح المعمل إذن على التحاليل المطلوبة', en: 'The lab was granted access to the requested tests' }, at: nowIso() });
  save();
  return { order: orderView(db, order), appointment: appt(db, b) };
});
// تغيير المعمل لتحليل واحد (قبل ما المعمل يبدأ): التحليل يرجع "بانتظار المعمل" ويختار معمل تاني
r.post('/patient/lab-orders/:id/items/:itemId/unassign', (ctx) => {
  const { db, user } = ctx;
  const order = db.labOrders.find((o) => o.id === ctx.params.id && o.patientId === user.id);
  const item = order && order.items.find((i) => i.id === ctx.params.itemId);
  if (!item) fail(404, 'not_found');
  if (item.status === 'awaiting_lab') fail(409, 'invalid_data');
  const lab = db.labs[item.labId];
  const req = lab && lab.requests.find((x) => x.itemId === item.id);
  if (!req || req.status !== 'new') fail(409, 'order_started');
  lab.requests = lab.requests.filter((x) => x !== req);
  const bk = db.bookings.find((x) => x.id === item.bookingId);
  if (bk) { bk.itemIds = (bk.itemIds || []).filter((id) => id !== item.id); bk.test = order.items.filter((i) => bk.itemIds.includes(i.id)).map((i) => i.name).join('، '); if (!bk.itemIds.length) db.bookings = db.bookings.filter((x) => x !== bk); }
  const oldLab = item.labId;
  item.status = 'awaiting_lab'; item.labId = null; item.bookingId = null;
  order.status = orderState(order);
  // لو المعمل القديم معندوش أي طلبات تانية لنفس المريض: نسحب إذنه
  if (!lab.requests.some((x) => x.patientId === user.id)) { const pm = patientOf(db, user.id).permissions; pm.active = pm.active.filter((g) => g.granteeId !== oldLab); }
  save();
  return orderView(db, order);
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
