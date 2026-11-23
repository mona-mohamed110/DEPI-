// ===== endpoints مشتركة بين كل الأدوار =====
//   GET /me   |  PUT /me   (الاسم، الإيميل، الهاتف، إعدادات الإشعارات)
import { api } from './http.js';

export const getMe = () => api.get('/me');
export const updateMe = (data) => api.put('/me', data);
export const logoutAll = () => api.post('/me/logout-all');

// موقع العيادة/المعمل على الخريطة (للطبيب والمعمل)
export const getLocation = () => api.get('/me/location');          // -> { lat, lng } (null لو لم يُحدد)
export const saveLocation = (pos) => api.put('/me/location', { lat: pos.lat, lng: pos.lng });
