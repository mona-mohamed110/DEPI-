// تواصل مع الإدارة (وضع العرض التجريبي): نفس شكل ردود الخادم الحقيقي
import { r, fail } from '../router.js';
import { save, uid } from '../db.js';
import { clean } from '../../api/security.js';

const KINDS = ['message', 'complaint', 'suggestion'];
const now = () => new Date().toISOString();
const norm = (c) => ({ kind: 'message', subject: '', status: 'new', replies: [], adminUnread: true, userUnread: false, role: 'visitor', ...c, id: c.id || uid('c'), createdAt: c.createdAt || c.at || now(), updatedAt: c.updatedAt || c.at || now() });
const ensure = (db) => { db.contacts = db.contacts.map(norm); return db.contacts; };
const userView = (m) => ({ id: m.id, kind: m.kind, subject: m.subject, message: m.message, status: m.status, unread: m.userUnread, createdAt: m.createdAt, updatedAt: m.updatedAt, replies: m.replies.map((x) => ({ id: x.id, from: x.from, text: x.text, at: x.at })) });
const adminRow = (m, full) => ({ id: m.id, kind: m.kind, subject: m.subject, preview: String(m.message).slice(0, 120), name: m.name, email: m.email, phone: m.phone || '', role: m.role, registered: !!m.userId, status: m.status, unread: m.adminUnread, replyCount: m.replies.length, createdAt: m.createdAt, updatedAt: m.updatedAt, ...(full ? { message: m.message, replies: m.replies } : {}) });
const find = (db, id) => ensure(db).find((m) => m.id === id) || fail(404, 'not_found');

r.get('/support/mine', ({ db, user }) => ensure(db).filter((m) => m.userId === user.id).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)).map(userView));
r.post('/support', ({ db, user, body }) => {
  if (clean(body.message).length < 5) fail(400, 'invalid_data');
  const m = norm({ id: uid('c'), kind: KINDS.includes(body.kind) ? body.kind : 'message', subject: clean(body.subject, 120), message: clean(body.message, 2000), userId: user.id, role: user.role, name: user.name, email: user.email, phone: user.phone });
  db.contacts.unshift(m); save(); return userView(m);
});
r.post('/support/:id/reply', ({ db, user, params, body }) => {
  const m = find(db, params.id); if (m.userId !== user.id) fail(404, 'not_found');
  if (m.status === 'closed') fail(409, 'conversation_closed');
  if (clean(body.text).length < 2) fail(400, 'invalid_data');
  m.replies.push({ id: uid('r'), from: 'user', text: clean(body.text, 2000), at: now() }); m.status = 'new'; m.adminUnread = true; m.updatedAt = now(); save(); return userView(m);
});
r.post('/support/:id/seen', ({ db, user, params }) => { const m = find(db, params.id); if (m.userId !== user.id) fail(404, 'not_found'); m.userUnread = false; save(); return userView(m); });

r.get('/admin/messages/unread', ({ db }) => ({ count: ensure(db).filter((m) => m.adminUnread).length }));
r.get('/admin/messages', ({ db, query }) => {
  const items = ensure(db).filter((m) => (!query.status || m.status === query.status) && (!query.kind || m.kind === query.kind) && (!query.role || m.role === query.role));
  return { unread: db.contacts.filter((m) => m.adminUnread).length, items: items.map((m) => adminRow(m)) };
});
r.get('/admin/messages/:id', ({ db, params }) => { const m = find(db, params.id); m.adminUnread = false; save(); return adminRow(m, true); });
r.post('/admin/messages/:id/reply', ({ db, user, params, body }) => {
  const m = find(db, params.id);
  if (clean(body.text).length < 2) fail(400, 'invalid_data');
  m.replies.push({ id: uid('r'), from: 'admin', text: clean(body.text, 2000), byName: user.name, emailed: !m.userId, at: now() });
  m.status = 'replied'; m.adminUnread = false; m.userUnread = true; m.updatedAt = now(); save(); return adminRow(m, true);
});
r.patch('/admin/messages/:id', ({ db, params, body }) => { const m = find(db, params.id); if (!['new', 'replied', 'closed'].includes(body.status)) fail(400, 'invalid_data'); m.status = body.status; save(); return adminRow(m, true); });
r.del('/admin/messages/:id', ({ db, params }) => { find(db, params.id); db.contacts = db.contacts.filter((m) => m.id !== params.id); save(); return { ok: true }; });
