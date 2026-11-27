// ===== التقييمات =====
//   GET  /reviews/provider/mine   زيارات بانتظار التقييم + تقييماتي (مريض)
//   POST /reviews/provider        {bookingId, rating, comment}
//   GET/PUT /reviews/platform     تقييمي للمنصة (مريض/طبيب/معمل)
//   GET  /public/testimonials     التقييمات المختارة للرئيسية
import { api } from './http.js';

export const getMyProviderReviews = () => api.get('/reviews/provider/mine');
export const rateProvider = (b) => api.post('/reviews/provider', b);
export const getMyPlatformReview = () => api.get('/reviews/platform');
export const savePlatformReview = (b) => api.put('/reviews/platform', b);
export const getTestimonials = () => api.get('/public/testimonials');

// admin
export const getAdminReviews = (f = {}) => api.get('/admin/reviews', Object.fromEntries(Object.entries(f).filter(([, v]) => v)));
export const updateAdminReview = (id, b) => api.patch(`/admin/reviews/${id}`, b);
export const deleteAdminReview = (id) => api.del(`/admin/reviews/${id}`);
export const getReviewSettings = () => api.get('/admin/reviews/settings');
export const saveReviewSettings = (b) => api.put('/admin/reviews/settings', b);
