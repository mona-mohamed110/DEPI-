// المواعيد المتاحة من ساعات العمل الفعلية — الجدول مرتب من السبت (٠) إلى الجمعة (٦) — نفس منطق السيرفر
// dow هنا هو getDay() في جافاسكربت (الأحد = 0) ويُحوَّل لترتيب الجدول
const idx = (dow) => (dow + 1) % 7;
const toMin = (s) => { const m = /^(\d{1,2}):(\d{2})$/.exec(String(s || '')); return m ? Number(m[1]) * 60 + Number(m[2]) : null; };
const fmt = (n) => `${String(Math.floor(n / 60)).padStart(2, '0')}:${String(n % 60).padStart(2, '0')}`;
export const SLOT_MINUTES = 30;

export const dayOn = (schedule, dow) => !!(schedule && schedule[idx(dow)] && schedule[idx(dow)].on && slotsOf(schedule[idx(dow)]).length);

function slotsOf(d) {
  const a = toMin(d.from), b = toMin(d.to);
  if (a === null || b === null || b <= a) return [];
  const out = [];
  for (let m = a; m + SLOT_MINUTES <= b; m += SLOT_MINUTES) out.push(fmt(m));
  return out;
}

// dateStr = YYYY-MM-DD
export function slotsForDate(schedule, dateStr) {
  if (!schedule || !dateStr) return [];
  const dow = new Date(`${dateStr}T00:00:00Z`).getUTCDay();
  const d = schedule[idx(dow)];
  return d && d.on ? slotsOf(d) : [];
}
