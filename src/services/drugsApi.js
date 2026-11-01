// خدمة الأدوية: تقرأ الملف src/data/egyptian-drugs.json
// - يُحمَّل عند أول فتح لقائمة الأدوية فقط (ملف منفصل، لا يثقل باقي الموقع).
// - إن لم يوجد الملف في src/data يُجرَّب /egyptian-drugs.json من مجلد public.
// - لاستخدام API حقيقي لاحقاً: ضع الرابط في .env  →  VITE_DRUGS_API_URL=https://...
const API_URL = import.meta.env.VITE_DRUGS_API_URL;
const localFiles = import.meta.glob('../data/egyptian-drugs.json');

async function fetchJson(url) {
  const r = await fetch(url);
  if (!r.ok) throw new Error(`HTTP ${r.status} عند طلب ${url}`);
  return r.json();
}

async function fetchDrugs() {
  if (API_URL) return fetchJson(API_URL);
  const loadLocal = Object.values(localFiles)[0];
  if (loadLocal) return (await loadLocal()).default;
  return fetchJson('../data/egyptian-drugs.json');
}

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
        if (!Array.isArray(list)) throw new Error('صيغة ملف الأدوية غير متوقعة: يجب أن يكون مصفوفة');
        cache = list.map((d) => ({
          ...d,
          _n: norm(`${d.commercial_name_en} ${d.commercial_name_ar}`),
          _s: norm(d.scientific_name),
        }));
        return cache;
      })
      .catch((e) => {
        console.error('[drugsApi] تعذر تحميل قائمة الأدوية:', e);
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
