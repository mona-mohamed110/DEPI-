// ===== endpoints مشتركة بين كل الأدوار =====
//   GET /me   |  PUT /me   (الاسم، الإيميل، الهاتف، إعدادات الإشعارات)
import { api } from './http.js';

export const getMe = () => api.get('/me');
export const updateMe = (data) => api.put('/me', data);
export const logoutAll = () => api.post('/me/logout-all');
