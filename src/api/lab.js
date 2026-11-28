// ===== API المعمل — كل الـ endpoints تحت /lab =====
//   GET   /lab/requests?status=new|progress|done|pending
//   POST  /lab/requests {name,sex,age,phone,test,kind}
//   PATCH /lab/requests/:id/start
//   POST  /lab/requests/:id/result  (files[] + notes)
//   GET   /lab/results?name=&date=YYYY-MM-DD   |   GET /lab/results/dates
//   GET   /lab/profile  |  PUT /lab/profile
import { api, upload, openProtectedFile } from './http.js';

export const getRequests = (status) => api.get('/lab/requests', { status });
export const createRequest = (d) => api.post('/lab/requests', d);
export const startRequest = (id) => api.patch(`/lab/requests/${id}/start`);
export const uploadResult = (id, { files, notes, status }) => upload(`/lab/requests/${id}/result`, files, { notes, status });
export const editResult = (id, { files, notes, status, remove }) => upload(`/lab/requests/${id}/result/edit`, files, { notes, status, remove });
export const deleteResult = (id) => api.del(`/lab/requests/${id}/result`);
// فتح ملف نتيجة (في وضع التجربة بنفتح الملف المحفوظ محليًا)
export const openResultFile = (q, i) => {
  const d = q.fileData && q.fileData[i];
  if (d) { window.open(d, '_blank'); return Promise.resolve(); }
  return openProtectedFile(`/lab/requests/${q.id}/files/${i}`);
};
export const getResults = ({ name = '', date = '' } = {}) => api.get('/lab/results', { name, date });
export const getResultDates = () => api.get('/lab/results/dates');
export const getLabProfile = () => api.get('/lab/profile');
export const updateLabProfile = (p) => api.put('/lab/profile', p);

// يحول التاريخ ليوم محلي بصيغة YYYY-MM-DD
export const dayKey = (iso) => {
  const d = new Date(iso);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};
export const fileType = (n) => { const x = n.split('.').pop().toLowerCase(); return x === 'pdf' ? 'PDF' : x === 'dcm' ? 'DICOM' : 'IMG'; };
