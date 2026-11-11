// دوال مساعدة مشتركة بين routes الـ mock (منطق الربط بين المريض والدكتور والاستقبال والمعمل)
import { bucket, save, uid } from './db.js';
import { CHRONIC } from '../config/catalog.js';

export const pad = (n) => String(n).padStart(2, '0');
export const dayKey = (d = new Date()) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
export const addDays = (n) => dayKey(new Date(Date.now() + n * 86400000));
export const todayKey = () => dayKey();
export const ageFrom = (birth) => {
  if (!birth) return null;
  const b = new Date(`${birth}T00:00:00`), n = new Date();
  let a = n.getFullYear() - b.getFullYear();
  if (n.getMonth() < b.getMonth() || (n.getMonth() === b.getMonth() && n.getDate() < b.getDate())) a -= 1;
  return a >= 0 ? a : null;
};
export const chronicFromIds = (ids = []) => ids.map((id) => CHRONIC.find((c) => c.id === id)).filter(Boolean).map(({ ar, en }) => ({ ar, en }));
export const chronicToIds = (list = []) => list.map((c) => CHRONIC.find((x) => x.ar === (c.ar ?? c))?.id).filter(Boolean);

export const emptyPatient = () => ({ info: {}, chronic: [], history: [], reports: [], prescriptions: [], results: [], permissions: { active: [], log: [] } });
export const patientOf = (db, id) => { bucket('patients', id, emptyPatient); return db.patients[id]; };
export const userName = (db, id) => db.users.find((u) => u.id === id)?.name || '';
export const hasStaff = (db, doctorId) => db.users.some((u) => u.role === 'reception' && u.doctorId === doctorId && u.status !== 'disabled');
export const place = (db, id) => db.places.find((p) => p.id === id);

// إذن الدكتور للاطلاع على ملف المريض (بيتمنح تلقائياً لما موظف الاستقبال يقبل الحجز)
export function grantDoctor(db, patientId, doctorId, days = 30) {
  const pm = patientOf(db, patientId).permissions;
  const until = addDays(days);
  const ex = pm.active.find((g) => g.granteeId === doctorId);
  if (ex) ex.until = until;
  else pm.active.push({ id: uid('g'), granteeId: doctorId, grantee: userName(db, doctorId), kind: 'doctor', scope: { ar: 'الملف الطبي كامل', en: 'Full medical file' }, until });
  pm.log.unshift({ id: uid('l'), who: userName(db, doctorId), action: { ar: 'تم منح إذن الاطلاع بعد قبول الحجز', en: 'Access granted after the booking was accepted' }, at: new Date().toISOString() });
}
export const activeGrant = (db, patientId, doctorId) => {
  const g = patientOf(db, patientId).permissions.active.find((x) => x.granteeId === doctorId);
  return g && (!g.until || g.until >= todayKey()) ? g : null;
};
export const bookingStatusOf = (b) => b.status;
export { bucket, save, uid };
