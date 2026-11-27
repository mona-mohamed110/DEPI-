// ساعات العمل الفعلية للطبيب/المعمل: تُستخدم في عرض المواعيد المتاحة وفي رفض أي حجز خارجها
const SLOT_MINUTES = 30;

const DEFAULTS = {
  doctor: Array.from({ length: 7 }, (_, i) => ({ on: i >= 1 && i <= 5, from: "10:00", to: "17:00" })), // الأحد–الخميس
  lab: Array.from({ length: 7 }, (_, i) => ({ on: i < 6, from: "08:00", to: "20:00" })),
};

function getSchedule(user) {
  const saved = user.role === "lab" ? user.labProfile && user.labProfile.hours : user.schedule;
  return Array.isArray(saved) && saved.length === 7 ? saved : DEFAULTS[user.role] || DEFAULTS.doctor;
}

const toMin = (s) => {
  const m = /^(\d{1,2}):(\d{2})$/.exec(String(s || ""));
  return m ? Number(m[1]) * 60 + Number(m[2]) : null;
};
const fmt = (n) => String(Math.floor(n / 60)).padStart(2, "0") + ":" + String(n % 60).padStart(2, "0");

// رقم اليوم في الجدول من نص التاريخ YYYY-MM-DD
// الجداول محفوظة والأسبوع يبدأ بالسبت (٠ = السبت … ٦ = الجمعة) كما في شاشة الطبيب والمعمل
const dayOf = (date) => (new Date(`${date}T00:00:00Z`).getUTCDay() + 1) % 7;

// المواعيد المتاحة في يوم معيّن (كل ٣٠ دقيقة من البداية حتى قبل النهاية)
function slotsFor(schedule, date) {
  const d = schedule[dayOf(date)];
  const a = d && d.on ? toMin(d.from) : null;
  const b = d && d.on ? toMin(d.to) : null;
  if (a === null || b === null || b <= a) return [];
  const out = [];
  for (let m = a; m + SLOT_MINUTES <= b; m += SLOT_MINUTES) out.push(fmt(m));
  return out;
}

// هل الموعد داخل ساعات العمل؟ (أي وقت بين البداية والنهاية مقبول، لا يشترط أن يكون على نصف ساعة)
function withinHours(user, date, time) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return false;
  const d = getSchedule(user)[dayOf(date)];
  const t = toMin(time);
  const a = d && d.on ? toMin(d.from) : null;
  const b = d && d.on ? toMin(d.to) : null;
  return t !== null && a !== null && b !== null && t >= a && t < b;
}

module.exports = { getSchedule, slotsFor, withinHours };
