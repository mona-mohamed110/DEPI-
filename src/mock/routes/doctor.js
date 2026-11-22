import { r, fail } from '../router.js';
import { save, uid, bucket, patientOf, activeGrant, ageFrom, todayKey } from '../helpers.js';
import { TEST_CATALOG, SPECIALTIES, VISIT_TYPES } from '../../config/catalog.js';
import { sha256, isEmail, isStrongPassword, clean } from '../../api/security.js';

const empty = () => ({
  professional: { license: '', specialty: 'sp_internal', clinic: '', address: '', licenseFile: null },
  schedule: Array.from({ length: 7 }, (_, i) => ({ on: i < 5, from: '10:00', to: '17:00' })),
  team: [], customTests: [],
});
const D = ({ db, user }) => bucket('doctors', user.id, empty) && db.doctors[user.id];
const toStatus = (q) => (q === 'ended' ? 'done' : q === 'in-exam' ? 'exam' : 'wait');

// مرضى الدكتور = اللي أعطوه إذن اطلاع ساري (بيتمنح لما موظف الاستقبال يقبل الحجز)
const myPatients = ({ db, user }) => db.users.filter((u) => u.role === 'patient' && activeGrant(db, u.id, user.id)).map((u) => {
  const p = patientOf(db, u.id), g = activeGrant(db, u.id, user.id);
  return { id: u.id, name: u.name, age: ageFrom(p.info.birthDate), chronic: p.chronic, until: g.until };
});

r.get('/doctor/dashboard', (ctx) => {
  const today = todayKey();
  const list = ctx.db.bookings.filter((b) => b.kind === 'doctor' && b.providerId === ctx.user.id && ['confirmed', 'done'].includes(b.status) && b.date === today)
    .sort((a, b) => a.time.localeCompare(b.time)).map((b) => ({ id: b.id, name: b.patientName, time: b.time, status: toStatus(b.queue) }));
  return { stats: { today: list.length, waiting: list.filter((x) => x.status === 'wait').length, patients: myPatients(ctx).length }, appointments: list };
});
r.get('/doctor/patients', (ctx) => myPatients(ctx));
r.get('/doctor/patients/:id/file', (ctx) => {
  const u = ctx.db.users.find((x) => x.id === ctx.params.id && x.role === 'patient');
  if (!u) fail(404, 'not_found');
  if (!activeGrant(ctx.db, u.id, ctx.user.id)) fail(403, 'no_permission');
  const p = patientOf(ctx.db, u.id);
  const log = p.permissions.log; log.unshift({ id: uid('l'), who: ctx.user.name, action: { ar: 'اطلع على الملف الطبي', en: 'Viewed the medical file' }, at: new Date().toISOString() }); save();
  return {
    id: u.id, name: u.name, info: { ...p.info, age: ageFrom(p.info.birthDate) }, chronic: p.chronic, history: p.history, reports: p.reports,
    prescriptions: [...p.prescriptions].sort((a, b) => new Date(b.date) - new Date(a.date)), results: [...p.results].sort((a, b) => new Date(b.date) - new Date(a.date)),
  };
});

// حفظ الكشف: الروشتة (بأدويتها وجرعاتها ومدتها) بتتضاف لملف المريض، والتحاليل بتتبعت للمعمل كطلبات جديدة
r.post('/doctor/exams', (ctx) => {
  const { patientId, diagnosis, visit = 'new', meds = [], tests = [] } = ctx.body;
  const { db, user } = ctx, d = D(ctx);
  const pu = db.users.find((x) => x.id === patientId && x.role === 'patient');
  if (!pu || clean(diagnosis).length < 2 || (!meds.length && !tests.length)) fail(400, 'invalid_data');
  if (!activeGrant(db, patientId, user.id)) fail(403, 'no_permission');
  const rec = patientOf(db, patientId);
  const sp = SPECIALTIES.find((x) => x.id === d.professional.specialty) || SPECIALTIES[0];
  if (meds.length) {
    rec.prescriptions.unshift({
      id: uid('p'), doctorId: user.id, doctor: user.name, specialty: { ar: sp.ar, en: sp.en }, visit: VISIT_TYPES.includes(visit) ? visit : 'new', diagnosis: clean(diagnosis, 300), date: new Date().toISOString(), current: true,
      items: meds.map((m) => ({ name: clean(m.name, 120), dose: clean(m.dose, 120) || '—', duration: clean(m.duration, 60) || '—' })),
    });
  }
  rec.permissions.log.unshift({ id: uid('l'), who: user.name, action: { ar: 'أضاف كشف وروشتة جديدة', en: 'Added a new examination' }, at: new Date().toISOString() });
  const labId = Object.keys(db.labs)[0];
  if (labId && tests.length) {
    const reqs = db.labs[labId].requests;
    const age = ageFrom(rec.info.birthDate);
    tests.forEach((name) => {
      const cat = TEST_CATALOG.find((c) => c.ar === name || c.en === name);
      reqs.unshift({ id: Math.max(1000, ...reqs.map((x) => x.id)) + 1, name: typeof pu.name === 'object' ? pu.name.ar : pu.name, patientId, age: age ?? 0, sex: 'male', phone: pu.phone || '', test: cat ? cat.ar : name, kind: cat?.kind || 'lab', doctor: user.name, status: 'new', createdAt: new Date().toISOString() });
    });
  }
  // إنهاء حجز اليوم لو موجود
  const bk = db.bookings.find((b) => b.providerId === user.id && b.patientId === patientId && b.date === todayKey() && b.status === 'confirmed');
  if (bk) { bk.queue = 'ended'; bk.status = 'done'; }
  save();
  return { ok: true };
});

r.get('/doctor/tests', (ctx) => ({ defaults: TEST_CATALOG, custom: D(ctx).customTests }));
r.post('/doctor/tests', (ctx) => {
  const n = clean(ctx.body.name, 60); if (n.length < 2) fail(400, 'invalid_data');
  const d = D(ctx); if (!d.customTests.includes(n)) d.customTests.push(n); save();
  return d.customTests;
});
r.del('/doctor/tests/:name', (ctx) => { const d = D(ctx); d.customTests = d.customTests.filter((x) => x !== decodeURIComponent(ctx.params.name)); save(); return d.customTests; });

r.get('/doctor/schedule', (ctx) => D(ctx).schedule);
r.put('/doctor/schedule', (ctx) => {
  if (!Array.isArray(ctx.body.days) || ctx.body.days.length !== 7) fail(400, 'invalid_data');
  D(ctx).schedule = ctx.body.days.map((x) => ({ on: !!x.on, from: String(x.from).slice(0, 5), to: String(x.to).slice(0, 5) }));
  save(); return D(ctx).schedule;
});

r.get('/doctor/professional', (ctx) => D(ctx).professional);
r.put('/doctor/professional', (ctx) => {
  const p = D(ctx).professional, b = ctx.body;
  ['license', 'specialty', 'clinic', 'address'].forEach((k) => { if (b[k] !== undefined) p[k] = typeof b[k] === 'object' ? b[k] : clean(b[k], 120); });
  save(); return p;
});
r.post('/doctor/license-file', (ctx) => {
  const f = ctx.body.files?.[0]; if (!f) fail(400, 'invalid_data');
  D(ctx).professional.licenseFile = { name: f.name, type: f.type, dataUrl: f.dataUrl }; save();
  return D(ctx).professional;
});
r.del('/doctor/license-file', (ctx) => { D(ctx).professional.licenseFile = null; save(); return null; });

// ---- فريق العيادة (حسابات الاستقبال) ----
r.get('/doctor/team', (ctx) => D(ctx).team);
r.post('/doctor/team', async (ctx) => {
  const { name, email, password } = ctx.body;
  if (clean(name).length < 2 || !isEmail(email) || !isStrongPassword(password)) fail(400, 'invalid_data');
  if (ctx.db.users.some((u) => u.email.toLowerCase() === String(email).toLowerCase())) fail(409, 'email_exists');
  // الحساب بيتربط بالدكتور ده بس (doctorId) ويدخل كموظف استقبال لحجوزاته هو فقط
  const user = { id: uid('u'), role: 'reception', name: clean(name, 80), email: String(email).toLowerCase(), phone: '', status: 'active', doctorId: ctx.user.id, passHash: await sha256(password), createdAt: new Date().toISOString(), notifEmail: true, notifAppt: true, notifMeds: true, notifAccess: true, notifNew: true, twoFactor: false };
  ctx.db.users.push(user);
  const m = { id: uid('t'), userId: user.id, name: user.name, email: user.email, perms: [true, true, true] };
  D(ctx).team.push(m); save();
  return m;
});
r.patch('/doctor/team/:id', (ctx) => {
  const m = D(ctx).team.find((x) => x.id === ctx.params.id); if (!m) fail(404, 'not_found');
  if (Array.isArray(ctx.body.perms) && ctx.body.perms.length === 3) m.perms = ctx.body.perms.map(Boolean);
  save(); return m;
});
r.del('/doctor/team/:id', (ctx) => {
  const d = D(ctx), m = d.team.find((x) => x.id === ctx.params.id); if (!m) fail(404, 'not_found');
  d.team = d.team.filter((x) => x.id !== m.id);
  if (m.userId) ctx.db.users = ctx.db.users.filter((u) => u.id !== m.userId);
  save(); return null;
});
