// نقطة دخول واحدة لكل طبقة الـ API
export * as auth from './auth.js';
export * as shared from './shared.js';
export * as publicApi from './public.js';
export * as patient from './patient.js';
export * as doctor from './doctor.js';
export * as lab from './lab.js';
export * as reception from './reception.js';
export * as admin from './admin.js';
export { api, ApiError } from './http.js';
