// ===== API المريض — كل الـ endpoints تحت /patient (السيرفر يطبّق الصلاحية حسب المستخدم الداخل) =====
import { api, upload } from './http.js';

export const getDashboard = () => api.get('/patient/dashboard');
export const getProfile = () => api.get('/patient/profile');
export const updateProfile = (d) => api.put('/patient/profile', d);
export const getMedicalFile = () => api.get('/patient/medical-file');
export const uploadReports = (files) => upload('/patient/reports', files, {}, { maxBytes: 5 * 1024 * 1024, exts: ['pdf', 'png', 'jpg', 'jpeg', 'webp'] });
export const deleteReport = (id) => api.del(`/patient/reports/${id}`);
export const getPrescriptions = (current) => api.get('/patient/prescriptions', { current });
export const setPrescriptionCurrent = (id, current) => api.patch(`/patient/prescriptions/${id}`, { current });
export const addHistory = (d) => api.post('/patient/history', d);
export const updateHistory = (id, d) => api.put(`/patient/history/${id}`, d);
export const getResults = () => api.get('/patient/results');
export const triage = (text) => api.post('/patient/triage', { text });
// التحاليل المطلوبة: الدكتور بيكتبها، والمريض بيختار المعمل (لكل تحليل معمل منفصل، أو الكل في معمل واحد)
//   GET  /patient/lab-orders?status=open|all
//   POST /patient/lab-orders/:id/assign                  {labId, date, time, itemIds?}   (itemIds فاضي = كل اللي لسه ما اتحجزش)
//   POST /patient/lab-orders/:id/items/:itemId/unassign  تغيير المعمل (قبل ما المعمل يبدأ)
export const getLabOrders = (status = 'open') => api.get('/patient/lab-orders', { status });
export const assignLabOrder = (id, d) => api.post(`/patient/lab-orders/${id}/assign`, d);
export const unassignLabItem = (id, itemId) => api.post(`/patient/lab-orders/${id}/items/${itemId}/unassign`);
export const getAppointments = () => api.get('/patient/appointments');
export const bookAppointment = (d) => api.post('/patient/appointments', d);
export const updateAppointment = (id, d) => api.patch(`/patient/appointments/${id}`, d);
export const cancelAppointment = (id) => api.del(`/patient/appointments/${id}`);
export const getActivePermissions = () => api.get('/patient/permissions/active');
export const revokePermission = (id) => api.del(`/patient/permissions/active/${id}`);
export const revokeAllPermissions = () => api.del('/patient/permissions/active');
export const getPermissionRequests = () => api.get('/patient/permissions/requests');
export const decideRequest = (id, approve) => api.post(`/patient/permissions/requests/${id}/${approve ? 'approve' : 'reject'}`);
export const getAccessLog = () => api.get('/patient/permissions/log');
