// ===== API الأدمن — كل الـ endpoints تحت /admin =====
import { api, request } from './http.js';

export const getMonitoring = () => api.get('/admin/monitoring');
export const getLicenses = () => api.get('/admin/licenses');
export const approveLicense = (id) => api.post(`/admin/licenses/${id}/approve`);
export const rejectLicense = (id, reason) => api.post(`/admin/licenses/${id}/reject`, { reason });
export const getAccounts = () => api.get('/admin/accounts');
export const setAccountActive = (id, active) => api.patch(`/admin/accounts/${id}`, { active });

// رسائل وشكاوى واقتراحات المستخدمين والزوار
export const getMessages = (f = {}) => api.get('/admin/messages', Object.fromEntries(Object.entries(f).filter(([, v]) => v)));
export const getMessageCount = () => api.get('/admin/messages/unread');
export const getMessage = (id) => api.get(`/admin/messages/${id}`);
export const replyMessage = (id, text) => api.post(`/admin/messages/${id}/reply`, { text });
export const setMessageStatus = (id, status) => api.patch(`/admin/messages/${id}`, { status });
export const deleteMessage = (id) => api.del(`/admin/messages/${id}`);

// صلاحيات المستخدم الحالي + مستخدمو اللوحة + سجل النشاط (الأدمن الرئيسي فقط)
export const getAccess = () => api.get('/admin/access');
export const getPanelUsers = () => api.get('/admin/users');
export const addPanelUser = (b) => api.post('/admin/users', b);
export const updatePanelUser = (id, b) => api.patch(`/admin/users/${id}`, b);
export const deletePanelUser = (id) => api.del(`/admin/users/${id}`);
export const getActivity = (f = {}) => api.get('/admin/activity', Object.fromEntries(Object.entries(f).filter(([, v]) => v)));

// تصميم رسائل البريد
export const getEmailDesign = () => api.get('/admin/email-design');
export const saveEmailDesign = (b) => api.put('/admin/email-design', b);
export const previewEmailDesign = (design, lang) => api.post('/admin/email-design/preview', { design, lang });
export const uploadEmailLogo = (file) => { const form = new FormData(); form.append('logo', file); return request('/admin/email-design/logo', { method: 'POST', form }); };
export const removeEmailLogo = () => api.del('/admin/email-design/logo');
export const testEmailDesign = () => api.post('/admin/email-design/test');
