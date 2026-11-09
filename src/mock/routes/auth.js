import { r, fail } from '../router.js';
import { save, uid } from '../db.js';
import { chronicFromIds, patientOf, emptyPatient } from '../helpers.js';
import { BLOOD_TYPES } from '../../config/catalog.js';
import { sha256, isEmail, isStrongPassword, clean } from '../../api/security.js';
import { REQUIRE_LICENSE_APPROVAL } from '../../config/env.js';

export const publicUser = (u) => ({ id: u.id, name: u.name, email: u.email, role: u.role, phone: u.phone, status: u.status });
const findByEmail = (db, email) => db.users.find((u) => u.email.toLowerCase() === String(email || '').toLowerCase());
const passOk = async (u, pw) => (u.passHash ? (await sha256(pw)) === u.passHash : u.password === pw);

r.post('/auth/login', async ({ body, db }) => {
  const u = findByEmail(db, body.email);
  if (!u || !(await passOk(u, String(body.password || '')))) fail(401, 'invalid_credentials');
  if (u.status === 'disabled') fail(403, 'account_disabled');
  if (u.status === 'pending' && REQUIRE_LICENSE_APPROVAL) fail(403, 'pending_license');
  const token = `mock.${uid('t')}`;
  db.sessions[token] = { userId: u.id, at: Date.now() };
  save();
  return { token, user: publicUser(u) };
}, true);

r.post('/auth/register', async ({ body, db }) => {
  const { role, fullName, email, phone, password, extra, license, profile = {}, files = [] } = body;
  if (!['patient', 'doctor', 'lab'].includes(role)) fail(400, 'invalid_data');
  if (clean(fullName).length < 3 || !isEmail(email) || !isStrongPassword(password)) fail(400, 'invalid_data');
  if (findByEmail(db, email)) fail(409, 'email_exists');
  const needsLicense = role !== 'patient';
  if (needsLicense && !files[0]) fail(400, 'invalid_data'); // الشهادة (صورة أو PDF) إجبارية للطبيب والمعمل
  if (role === 'patient') {
    const b = profile.birthDate;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(b || '') || new Date(b) >= new Date()) fail(400, 'invalid_data');
    if (profile.blood && !BLOOD_TYPES.includes(profile.blood)) fail(400, 'invalid_data');
  }
  const user = {
    id: uid('u'), role, email: String(email).toLowerCase(), phone: clean(phone, 20), passHash: await sha256(password),
    name: role === 'lab' && extra ? clean(extra, 80) : clean(fullName, 80), extra: clean(extra, 80),
    status: needsLicense && REQUIRE_LICENSE_APPROVAL ? 'pending' : 'active', createdAt: new Date().toISOString(),
    notifEmail: true, notifAppt: true, notifMeds: true, notifAccess: true, notifNew: true, twoFactor: false,
  };
  db.users.push(user);
  if (role === 'patient') {
    const rec = emptyPatient(); db.patients[user.id] = rec;
    rec.info = { birthDate: profile.birthDate, blood: profile.blood || '', height: Number(profile.height) || 0, weight: Number(profile.weight) || 0 };
    rec.chronic = chronicFromIds(profile.chronicIds || []);
  }
  if (needsLicense) {
    db.licenses.unshift({ id: Date.now(), userId: user.id, name: user.name, type: role === 'doctor' ? 'dr' : 'lab', number: clean(license, 40) || '—', by: role === 'doctor' ? 'syndicate' : 'ministry', sentAt: new Date().toISOString(), status: 'pend', reason: '', file: { name: files[0].name, type: files[0].type, dataUrl: files[0].dataUrl || null } });
    if (role === 'doctor') db.doctors[user.id] = { professional: { license: clean(license, 40), specialty: clean(extra, 20) || 'sp_internal', clinic: '', address: '', licenseFile: { name: files[0].name, type: files[0].type, dataUrl: files[0].dataUrl || null } }, schedule: Array.from({ length: 7 }, (_, i) => ({ on: i < 5, from: '10:00', to: '17:00' })), team: [], customTests: [] };
  }
  save();
  return { ok: true, status: user.status };
}, true);

r.get('/auth/me', ({ user }) => publicUser(user));
r.post('/auth/logout', ({ db, session }) => { if (session?.token) { delete db.sessions[session.token]; save(); } return null; });

// نسيت كلمة المرور: بنبعت كود على الإيميل (في الـ mock الكود دايماً 123456)
r.post('/auth/forgot-password', ({ body, db }) => {
  if (!isEmail(body.email)) fail(400, 'invalid_data');
  if (findByEmail(db, body.email)) { db.resets[String(body.email).toLowerCase()] = { code: '123456', exp: Date.now() + 10 * 60000 }; save(); }
  return { ok: true, devCode: '123456' }; // نفس الرد سواء الإيميل موجود أو لأ (منع تخمين الحسابات)
}, true);
r.post('/auth/verify-code', ({ body, db }) => {
  const k = String(body.email).toLowerCase(), x = db.resets[k];
  if (!x || x.exp < Date.now() || x.code !== String(body.code)) fail(400, 'invalid_code');
  x.token = uid('rs'); save();
  return { resetToken: x.token };
}, true);
r.post('/auth/reset-password', async ({ body, db }) => {
  const k = String(body.email).toLowerCase(), x = db.resets[k], u = findByEmail(db, k);
  if (!x || !u || x.token !== body.resetToken || !isStrongPassword(body.password)) fail(400, 'invalid_code');
  u.passHash = await sha256(body.password); delete u.password; delete db.resets[k]; save();
  return { ok: true };
}, true);
r.post('/auth/change-password', async ({ body, user }) => {
  if (!(await passOk(user, String(body.current || '')))) fail(400, 'wrong_password');
  if (!isStrongPassword(body.next)) fail(400, 'invalid_data');
  user.passHash = await sha256(body.next); delete user.password; save();
  return { ok: true };
});

// بيانات الحساب المشتركة لكل الأدوار
r.get('/me', ({ user }) => ({ ...publicUser(user), notifEmail: user.notifEmail, notifAppt: user.notifAppt, notifMeds: user.notifMeds, notifAccess: user.notifAccess, notifNew: user.notifNew, twoFactor: user.twoFactor }));
r.put('/me', ({ body, user, db }) => {
  const patch = {};
  if (body.name !== undefined) { if (clean(body.name).length < 2) fail(400, 'invalid_data'); patch.name = clean(body.name, 80); }
  if (body.email !== undefined) {
    if (!isEmail(body.email)) fail(400, 'invalid_data');
    const other = findByEmail(db, body.email);
    if (other && other.id !== user.id) fail(409, 'email_exists');
    patch.email = String(body.email).toLowerCase();
  }
  if (body.phone !== undefined) patch.phone = clean(body.phone, 20);
  ['notifEmail', 'notifAppt', 'notifMeds', 'notifAccess', 'notifNew', 'twoFactor'].forEach((k) => { if (typeof body[k] === 'boolean') patch[k] = body[k]; });
  Object.assign(user, patch); save();
  return { ...publicUser(user), notifEmail: user.notifEmail, notifAppt: user.notifAppt, notifMeds: user.notifMeds, notifAccess: user.notifAccess, notifNew: user.notifNew, twoFactor: user.twoFactor };
});
r.post('/me/logout-all', ({ db, user }) => { Object.keys(db.sessions).forEach((t) => { if (db.sessions[t].userId === user.id) delete db.sessions[t]; }); save(); return { ok: true }; });

// ---- عام ----
r.get('/public/places', ({ query, db }) => {
  const q = String(query.q || '').toLowerCase();
  return db.places.filter((p) => (!query.type || p.type === query.type) &&
    (!q || [p.name, p.specialty, p.city, p.address].some((x) => Object.values(x || {}).join(' ').toLowerCase().includes(q))));
}, true);
r.post('/public/contact', ({ body, db }) => {
  if (!isEmail(body.email) || clean(body.message).length < 5) fail(400, 'invalid_data');
  db.contacts.push({ ...body, at: new Date().toISOString() }); save();
  return { ok: true };
}, true);
