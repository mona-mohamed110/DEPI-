// ===== API الطبيب — كل الـ endpoints تحت /doctor =====
import { api, upload } from './http.js';

export const getDashboard = () => api.get('/doctor/dashboard');
export const getPatients = () => api.get('/doctor/patients');
export const getPatientFile = (id) => api.get(`/doctor/patients/${id}/file`);
export const saveExam = (d) => api.post('/doctor/exams', d);
export const getTests = () => api.get('/doctor/tests');
export const addTest = (name) => api.post('/doctor/tests', { name });
export const removeTest = (name) => api.del(`/doctor/tests/${encodeURIComponent(name)}`);
export const getSchedule = () => api.get('/doctor/schedule');
export const saveSchedule = (days) => api.put('/doctor/schedule', { days });
export const getProfessional = () => api.get('/doctor/professional');
export const saveProfessional = (d) => api.put('/doctor/professional', d);
export const uploadLicense = (file) => upload('/doctor/license-file', file, {}, { maxBytes: 3 * 1024 * 1024, exts: ['pdf', 'png', 'jpg', 'jpeg', 'webp'] });
export const removeLicense = () => api.del('/doctor/license-file');
export const getTeam = () => api.get('/doctor/team');
export const addStaff = (d) => api.post('/doctor/team', d);
export const setStaffPerms = (id, perms) => api.patch(`/doctor/team/${id}`, { perms });
export const removeStaff = (id) => api.del(`/doctor/team/${id}`);
