/* =====================================================================
   request.js
   - request(): دالة الاتصال المشتركة (headers + توكن + معالجة الأخطاء)
   - سيرفر وهمي صغير (USE_MOCK) علشان تشوف الصفحات شغالة قبل ما تربط الـ API.
     الـ mock مشترك بين التابات، فالموافقة على طلب بتظهر فعلًا في "الأذونات النشطة".
   ===================================================================== */

const API_BASE = "/api";        // عدّل حسب الباك إند
export const USE_MOCK = true;   // خليها false لما توصل الـ API الحقيقي

const getToken = () => localStorage.getItem("token"); // عدّلها حسب نظام الدخول عندك

// بيقبل الرد كمصفوفة مباشرة أو جوه data / items / requests
export const extractList = (res) =>
  Array.isArray(res) ? res : res?.data ?? res?.items ?? res?.requests ?? [];

export async function request(path, options = {}, signal) {
  if (USE_MOCK) return mockRequest(path, options);

  const token = getToken();
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    signal,
    headers: {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
  });

  if (!res.ok) {
    let message = "حدث خطأ، حاول مرة أخرى.";
    try {
      message = (await res.json()).message || message;
    } catch {
      /* الرد مش JSON */
    }
    throw new Error(message);
  }
  return res.status === 204 ? null : res.json();
}

/* ---------------------------------------------------------------------
   السيرفر الوهمي (بيتشال لما USE_MOCK = false)
   --------------------------------------------------------------------- */
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const clone = (x) => JSON.parse(JSON.stringify(x));

const dateAfter = (days) => {
  const d = new Date();
  d.setDate(d.getDate() + days);
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};
const timeAt = (dayOffset, h, m) => {
  const d = new Date();
  d.setDate(d.getDate() + dayOffset);
  d.setHours(h, m, 0, 0);
  return d.toISOString();
};

const db = {
  permissions: [
    { id: 1, type: "doctor", name: "د. أحمد سمير", accessLevel: "وصول كامل", expiresAt: dateAfter(60) },
    { id: 2, type: "hospital", name: "مستشفى النور", accessLevel: "الروشتات والتحاليل", expiresAt: dateAfter(30) },
    { id: 3, type: "lab", name: "معمل الأمل", accessLevel: "التحاليل فقط", expiresAt: dateAfter(15) },
  ],
  requests: [
    { id: 11, type: "lab", name: "معمل الأمل", requested: "نتائج التحاليل السابقة" },
    { id: 12, type: "doctor", name: "د. هبة نبيل", requested: "الملف الطبي كامل" },
    { id: 13, type: "radiology", name: "مركز الشفاء للأشعة", requested: "الأشعة والتحاليل" },
  ],
  log: [
    { id: 1, name: "د. أحمد سمير", action: "فتح الملف الطبي", at: timeAt(0, 9, 15) },
    { id: 2, name: "معمل الأمل", action: "عرض نتيجة CBC", at: timeAt(-1, 18, 30) },
    { id: 3, name: "مستشفى النور", action: "عرض الروشتات", at: timeAt(-4, 11, 0) },
  ],
};

async function mockRequest(path, { method = "GET" } = {}) {
  await wait(500);
  const [pathname] = path.split("?");
  let m;

  if (method === "GET" && pathname === "/permissions/active") return clone(db.permissions);
  if (method === "GET" && pathname === "/permissions/log") return clone(db.log);
  if (method === "GET" && pathname === "/permissions/requests") return clone(db.requests);

  if (method === "POST" && pathname === "/permissions/revoke-all") {
    db.permissions = [];
    return null;
  }

  if (method === "DELETE" && (m = pathname.match(/^\/permissions\/([^/]+)$/))) {
    db.permissions = db.permissions.filter((p) => String(p.id) !== m[1]);
    return null;
  }

  if (method === "POST" && (m = pathname.match(/^\/permissions\/requests\/([^/]+)\/(approve|reject)$/))) {
    const req = db.requests.find((r) => String(r.id) === m[1]);
    db.requests = db.requests.filter((r) => String(r.id) !== m[1]);
    if (req && m[2] === "approve") {
      // الموافقة بتضيف الإذن في قائمة الأذونات النشطة
      db.permissions.push({
        id: Date.now(),
        type: req.type,
        name: req.name,
        accessLevel: req.requested,
        expiresAt: null,
      });
    }
    return null;
  }

  throw new Error("Mock: endpoint غير معروف");
}
