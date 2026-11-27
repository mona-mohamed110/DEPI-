// ===== تواصل المستخدمين المسجلين مع الإدارة (كل الأدوار) =====
//   GET  /support/mine            رسائلي مع الردود
//   POST /support                 رسالة/شكوى/اقتراح جديد {kind, subject, message}
//   POST /support/:id/reply       متابعة المحادثة {text}
//   POST /support/:id/seen        علامة "مقروء" على ردود الإدارة
import { api } from './http.js';

export const getMine = () => api.get('/support/mine');
export const send = (data) => api.post('/support', data);
export const reply = (id, text) => api.post(`/support/${id}/reply`, { text });
export const markSeen = (id) => api.post(`/support/${id}/seen`);
