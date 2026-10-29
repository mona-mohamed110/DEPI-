// خدمة الأدوية: تقرأ الملف src/data/egyptian-drugs.json
// يُحمَّل بالاستيراد الديناميكي، فيصبح ملفاً منفصلاً لا يُحمَّل إلا عند أول فتح لقائمة الأدوية.
// لاستخدام API حقيقي لاحقاً: ضع الرابط في .env  →  VITE_DRUGS_API_URL=https://...
const API_URL = import.meta.env.VITE_DRUGS_API_URL;

const fetchDrugs = () =>
  API_URL
    ? fetch(API_URL).then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
    : import('../data/egyptian-drugs.json').then((m) => m.default);

const norm = (s) =>
  (s || '')
    .toLowerCase()
    .replace(/[أإآ]/g, 'ا')
    .replace(/ة/g, 'ه')
    .replace(/ى/g, 'ي')
    .trim();

let cache = null;
let pending = null;

// تحميل القائمة مرة واحدة فقط ثم الاحتفاظ بها في الذاكرة
export function loadDrugs() {
  if (cache) return Promise.resolve(cache);
  if (!pending) {
    pending = fetchDrugs()
      .then((list) => {
        cache = list.map((d) => ({
          ...d,
          _n: norm(`${d.commercial_name_en} ${d.commercial_name_ar}`),
          _s: norm(d.scientific_name),
        }));
        return cache;
      })
      .catch((e) => {
        pending = null;
        throw e;
      });
  }
  return pending;
}

// بحث بالاسم التجاري (عربي/إنجليزي) أو الاسم العلمي، مع إظهار الأقرب أولاً
export function searchDrugs(drugs, query, limit = 30) {
  const q = norm(query);
  if (q.length < 2) return [];
  const words = q.split(/\s+/);
  const starts = [];
  const contains = [];
  const generic = [];
  for (const d of drugs) {
    if (words.every((w) => d._n.includes(w))) (d._n.startsWith(q) ? starts : contains).push(d);
    else if (words.every((w) => d._s.includes(w))) generic.push(d);
    if (starts.length >= limit) break;
  }
  return [...starts, ...contains, ...generic].slice(0, limit);
}
