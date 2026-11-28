
// ===== API المريض — كل الـ endpoints تحت /patient =====

import { api, upload, openProtectedFile } from './http.js';

export const getDashboard = () => api.get('/patient/dashboard');

export const getProfile = () => api.get('/patient/profile');

export const updateProfile = (d) => api.put('/patient/profile', d);

export const getMedicalFile = () => api.get('/patient/medical-file');

export const uploadReports = (files) =>
  upload(
    '/patient/reports',
    files,
    {},
    {
      maxBytes: 5 * 1024 * 1024,
      exts: ['pdf', 'png', 'jpg', 'jpeg', 'webp'],
    }
  );

export const deleteReport = (id) =>
  api.del(`/patient/reports/${id}`);

export const getPrescriptions = (current) =>
  api.get('/patient/prescriptions', { current });

export const setPrescriptionCurrent = (id, current) =>
  api.patch(`/patient/prescriptions/${id}`, { current });

export const addHistory = (d) =>
  api.post('/patient/history', d);

export const updateHistory = (id, d) =>
  api.put(`/patient/history/${id}`, d);

export const getResults = () =>
  api.get('/patient/results');

// فتح ملف نتيجة التحليل أو الأشعة
export const openResultFile = (id) =>
  openProtectedFile(`/patient/results/${id}/file`);

export const openReportFile = (id) =>
  openProtectedFile(`/patient/reports/${id}/file`);

export const triage = (text, near) =>
  api.post('/patient/triage', near ? { text, near } : { text });

export const getAppointments = () =>
  api.get('/patient/appointments');

export const getRejectionCount = () => api.get('/patient/rejections/count');
export const markRejectionsSeen = () => api.post('/patient/rejections/seen');

export const getMyProviders = () => api.get('/patient/my-providers');

export const getActiveBooking = (providerId) => api.get('/patient/active-booking', { providerId });

export const getBookedSlots = (providerId, date) =>
  api.get('/patient/booked-slots', { providerId, date });

export const bookAppointment = (d) =>
  api.post('/patient/appointments', d);

export const updateAppointment = (id, d) =>
  api.patch(`/patient/appointments/${id}`, d);

export const requestEditAppointment = (id, d) =>
  api.post(`/patient/appointments/${id}/edit-request`, d);

export const withdrawEditRequest = (id) =>
  api.del(`/patient/appointments/${id}/edit-request`);

export const cancelAppointment = (id) =>
  api.del(`/patient/appointments/${id}`);

export const getActivePermissions = () =>
  api.get('/patient/permissions/active');

export const revokePermission = (id) =>
  api.del(`/patient/permissions/active/${id}`);

export const revokeAllPermissions = () =>
  api.del('/patient/permissions/active');

export const getPermissionRequests = () =>
  api.get('/patient/permissions/requests');

export const decideRequest = (id, approve) =>
  api.post(
    `/patient/permissions/requests/${id}/${approve ? 'approve' : 'reject'}`
  );

export const getAccessLog = () =>
  api.get('/patient/permissions/log');
