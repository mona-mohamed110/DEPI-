import { r, fail } from '../router.js';
import { save, uid, grantDoctor, todayKey, userName } from '../helpers.js';
import { clean, isEgPhone } from '../../api/security.js';

// موظف الاستقبال يدير حجوزات الدكتور اللي أضاف حسابه فقط (user.doctorId)
const docId = (ctx) => ctx.user.doctorId;
const mineAll = (ctx) => ctx.db.bookings.filter((b) => b.kind === 'doctor' && b.providerId === docId(ctx));
const need = (ctx) => { if (!docId(ctx)) fail(403, 'forbidden'); };
const findB = (ctx) => { need(ctx); const b = mineAll(ctx).find((x) => x.id === ctx.params.id); if (!b) fail(404, 'not_found'); return b; };
const view = (ctx, b) => ({ id: b.id, name: b.patientName, phone: b.phone, doctor: userName(ctx.db, docId(ctx)), time: b.time, date: b.date, status: b.queue });

r.get('/reception/requests', (ctx) => { need(ctx); return mineAll(ctx).filter((b) => b.status === 'pending').sort((a, b) => `${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`)).map((b) => ({ id: b.id, name: b.patientName, phone: b.phone, date: b.date, time: b.time })); });
// قبول الطلب: بيتأكد الحجز، بيظهر المريض عند الدكتور، وبيتمنح الدكتور إذن الاطلاع على ملفه
r.post('/reception/requests/:id/accept', (ctx) => {
  const b = findB(ctx); if (b.status !== 'pending') fail(400, 'invalid_data');
  b.status = 'confirmed'; b.queue = 'not-arrived';
  if (b.patientId) grantDoctor(ctx.db, b.patientId, docId(ctx));
  save(); return { id: b.id };
});
r.post('/reception/requests/:id/reject', (ctx) => { const b = findB(ctx); if (b.status !== 'pending') fail(400, 'invalid_data'); b.status = 'rejected'; save(); return { id: b.id }; });

r.get('/reception/queue', (ctx) => { need(ctx); const t = todayKey(); return mineAll(ctx).filter((b) => ['confirmed', 'done'].includes(b.status) && b.date === t).sort((a, b) => a.time.localeCompare(b.time)).map((b) => view(ctx, b)); });
r.patch('/reception/queue/:id', (ctx) => {
  const b = findB(ctx);
  if (!['not-arrived', 'arrived', 'in-exam', 'ended'].includes(ctx.body.status)) fail(400, 'invalid_data');
  b.queue = ctx.body.status; if (b.queue === 'ended') b.status = 'done'; else if (b.status === 'done') b.status = 'confirmed';
  save(); return view(ctx, b);
});

// مرضى العيادة: المضافين من الاستقبال + مرضى التطبيق اللي عندهم حجز
r.get('/reception/patients', (ctx) => {
  need(ctx);
  const own = (ctx.db.clinicPatients[docId(ctx)] || []).map((p) => ({ ...p, app: false }));
  const app = [];
  mineAll(ctx).forEach((b) => { if (b.patientId && !app.some((x) => x.id === b.patientId)) app.push({ id: b.patientId, name: b.patientName, phone: b.phone, app: true }); });
  return [...own, ...app];
});
r.post('/reception/patients', (ctx) => {
  need(ctx);
  const name = clean(ctx.body.name, 80), phone = clean(ctx.body.phone, 20);
  if (name.length < 3 || !isEgPhone(phone)) fail(400, 'invalid_data');
  const list = (ctx.db.clinicPatients[docId(ctx)] ||= []);
  const p = { id: uid('cp'), name, phone }; list.push(p); save(); return p;
});
r.post('/reception/appointments', (ctx) => {
  need(ctx);
  const { patientId, day, time } = ctx.body;
  const own = (ctx.db.clinicPatients[docId(ctx)] || []).find((x) => x.id === patientId);
  const appU = ctx.db.users.find((u) => u.id === patientId && u.role === 'patient');
  if ((!own && !appU) || !day || !time) fail(400, 'invalid_data');
  const date = day === 'today' ? todayKey() : day;
  const b = { id: uid('b'), kind: 'doctor', providerId: docId(ctx), patientId: appU ? appU.id : null, patientName: own ? own.name : appU.name, phone: own ? own.phone : appU.phone || '', date, time, status: 'confirmed', queue: 'not-arrived', source: 'reception', createdAt: new Date().toISOString() };
  ctx.db.bookings.push(b);
  if (appU) grantDoctor(ctx.db, appU.id, docId(ctx));
  save(); return view(ctx, b);
});
r.get('/reception/records', (ctx) => { need(ctx); return mineAll(ctx).filter((b) => b.queue === 'ended' && !b.hidden).sort((a, b) => `${b.date}${b.time}`.localeCompare(`${a.date}${a.time}`)).map((b) => view(ctx, b)); });
r.del('/reception/records/:id', (ctx) => { const b = findB(ctx); b.hidden = true; save(); return null; });
