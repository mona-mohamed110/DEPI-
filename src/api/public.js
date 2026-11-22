// ===== endpoints عامة (بدون تسجيل دخول) =====
//   GET  /public/places?type=doctor|lab&q=&city=   -> [{id,type,name,specialty,address,city,rating,lat,lng,...}]
//   POST /public/contact  {name,email,message}      -> يتبعت للإدارة على الإيميل
//   GET  /drugs/all                                 -> قائمة الأدوية (للطبيب)
import { api } from './http.js';
import { USE_MOCK } from '../config/env.js';

export const searchPlaces = (params) => api.get('/public/places', params);
export const sendContact = (data) => api.post('/public/contact', data);

const norm = (s) => (s || '').toLowerCase().replace(/[أإآ]/g, 'ا').replace(/ة/g, 'ه').replace(/ى/g, 'ي').trim();

let cache = null, pending = null;
// تحميل قائمة الأدوية مرة واحدة (من الـ API أو من ملف الـ mock) ثم حفظها في الذاكرة
export function loadDrugs() {
  if (cache) return Promise.resolve(cache);
  if (!pending) {
    const src = USE_MOCK ? import('../mock/egyptian-drugs.json').then((m) => m.default || m) : api.get('/drugs/all');
    pending = src.then((list) => {
      if (!Array.isArray(list)) throw new Error('bad drugs format');
      cache = list.map((d) => ({ ...d, _n: norm(`${d.commercial_name_en} ${d.commercial_name_ar}`), _s: norm(d.scientific_name) }));
      return cache;
    }).catch((e) => { pending = null; throw e; });
  }
  return pending;
}

// بحث بالاسم التجاري (عربي/إنجليزي) أو العلمي، الأقرب أولاً
export function searchDrugs(drugs, query, limit = 30) {
  const q = norm(query);
  if (q.length < 2) return [];
  const words = q.split(/\s+/);
  const starts = [], contains = [], generic = [];
  for (const d of drugs) {
    if (words.every((w) => d._n.includes(w))) (d._n.startsWith(q) ? starts : contains).push(d);
    else if (words.every((w) => d._s.includes(w))) generic.push(d);
    if (starts.length >= limit) break;
  }
  return [...starts, ...contains, ...generic].slice(0, limit);
}
