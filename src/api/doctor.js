// ===== API الطبيب — كل الـ endpoints تحت /doctor =====
import { api, upload } from './http.js';

export const getDashboard = (date, month) =>
  api.get(`/doctor/dashboard?date=${date}&month=${month}`);export const getPatients = (forExam) => api.get(`/doctor/patients${forExam ? '?forExam=1' : ''}`);
export const getPatientFile = (id) => api.get(`/doctor/patients/${id}/file`);
export const addPatientHistory = (id, d) => api.post(`/doctor/patients/${id}/history`, d);
export const updatePatientHistory = (id, hid, d) => api.put(`/doctor/patients/${id}/history/${hid}`, d);
export const delPatientHistory = (id, hid) => api.del(`/doctor/patients/${id}/history/${hid}`);
export const addPatientReports = (id, files) => upload(`/doctor/patients/${id}/reports`, files);
export const delPatientReport = (id, rid) => api.del(`/doctor/patients/${id}/reports/${rid}`);
export const addPatientResult = (id, files, d) => upload(`/doctor/patients/${id}/results`, files, d);
export const updatePatientResult = (id, rid, d) => api.put(`/doctor/patients/${id}/results/${rid}`, d);
export const delPatientResult = (id, rid) => api.del(`/doctor/patients/${id}/results/${rid}`);
export const updatePrescription = (id, rid, d) => api.put(`/doctor/patients/${id}/prescriptions/${rid}`, d);
export const updatePatientProfile = (id, d) => api.put(`/doctor/patients/${id}/profile`, d);
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
