// ===== API الاستقبال — كل الـ endpoints تحت /reception =====
import { api } from './http.js';

export const getRequests = () => api.get('/reception/requests');
export const acceptRequest = (id) => api.post(`/reception/requests/${id}/accept`);
export const rejectRequest = (id) => api.post(`/reception/requests/${id}/reject`);
export const getQueue = () => api.get('/reception/queue');
export const setQueueStatus = (id, status) => api.patch(`/reception/queue/${id}`, { status });
export const getPatients = () => api.get('/reception/patients');
export const addPatient = (d) => api.post('/reception/patients', d);
export const bookAppointment = (d) => api.post('/reception/appointments', d);
export const getRecords = () => api.get('/reception/records');
export const deleteRecord = (id) => api.del(`/reception/records/${id}`);
