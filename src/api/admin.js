// ===== API الأدمن — كل الـ endpoints تحت /admin =====
import { api } from './http.js';

export const getMonitoring = () => api.get('/admin/monitoring');
export const getLicenses = () => api.get('/admin/licenses');
export const approveLicense = (id) => api.post(`/admin/licenses/${id}/approve`);
export const rejectLicense = (id, reason) => api.post(`/admin/licenses/${id}/reject`, { reason });
export const getAccounts = () => api.get('/admin/accounts');
export const setAccountActive = (id, active) => api.patch(`/admin/accounts/${id}`, { active });
