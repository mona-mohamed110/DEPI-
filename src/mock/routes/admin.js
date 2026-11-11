import { r, fail } from '../router.js';
import { save } from '../db.js';
import { clean } from '../../api/security.js';

r.get('/admin/monitoring', ({ db }) => {
  const all = [...db.users, ...db.extraAccounts];
  const n = (role) => all.filter((u) => u.role === role).length;
  return { ...db.monitoring, usersByRole: { patient: n('patient'), doctor: n('doctor'), lab: n('lab'), reception: n('reception') } };
});
r.get('/admin/licenses', ({ db }) => db.licenses);
r.post('/admin/licenses/:id/approve', ({ db, params }) => {
  const l = db.licenses.find((x) => String(x.id) === params.id); if (!l) fail(404, 'not_found');
  l.status = 'ok'; l.reason = '';
  const u = db.users.find((x) => x.id === l.userId); if (u && u.status === 'pending') u.status = 'active';
  save(); return l;
});
r.post('/admin/licenses/:id/reject', ({ db, params, body }) => {
  const l = db.licenses.find((x) => String(x.id) === params.id); if (!l) fail(404, 'not_found');
  if (clean(body.reason).length < 2) fail(400, 'invalid_data');
  l.status = 'no'; l.reason = clean(body.reason, 200); save(); return l;
});
const toRow = (u) => ({ id: u.id, name: u.name, email: u.email, role: u.role, active: u.status !== 'disabled' });
r.get('/admin/accounts', ({ db }) => [...db.users.filter((u) => u.role !== 'admin').map(toRow), ...db.extraAccounts.map((u) => ({ ...toRow(u) }))]);
r.patch('/admin/accounts/:id', ({ db, params, body }) => {
  const u = db.users.find((x) => x.id === params.id) || db.extraAccounts.find((x) => x.id === params.id);
  if (!u || u.role === 'admin') fail(404, 'not_found');
  u.status = body.active ? 'active' : 'disabled';
  if (!body.active) Object.keys(db.sessions).forEach((t) => { if (db.sessions[t].userId === u.id) delete db.sessions[t]; });
  save(); return toRow(u);
});
