import { useCallback, useEffect, useMemo, useState } from "react";
import "../../components/Style/Patient/Appointments.css";

/* =====================================================================
   1) الإعدادات
   ===================================================================== */
const API_URL = "/api/appointments";   // عدّل المسار حسب الباك إند
const USE_MOCK = true;                 // خليها false لما توصل الـ API الحقيقي

const getToken = () => localStorage.getItem("token"); // عدّلها حسب نظام الدخول عندك

/* =====================================================================
   2) طبقة الـ API (استقبال البيانات + التعديل + الإلغاء)
   ===================================================================== */
async function request(path = "", options = {}, signal) {
  const token = getToken();
  const res = await fetch(`${API_URL}${path}`, {
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

const realApi = {
  getAll: (signal) => request("", {}, signal),
  update: (id, { date, time }) =>
    request(`/${id}`, { method: "PATCH", body: JSON.stringify({ date, time }) }),
  cancel: (id) => request(`/${id}`, { method: "DELETE" }),
};

/* ---- بيانات تجريبية بتتخزن في localStorage (بتتشال لما USE_MOCK = false) ---- */
const pad = (n) => String(n).padStart(2, "0");
const toDateInput = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const toTimeInput = (d) => `${pad(d.getHours())}:${pad(d.getMinutes())}`;

const readDb = () => JSON.parse(localStorage.getItem("appointments") || "[]");
const writeDb = (list) => localStorage.setItem("appointments", JSON.stringify(list));

const wait = (ms) => new Promise((r) => setTimeout(r, ms));

const mockApi = {
  getAll: async () => {
    await wait(600);
    return readDb();
  },
  update: async (id, { date, time }) => {
    await wait(500);
    const list = readDb().map((a) => (a.id === id ? { ...a, date, time } : a));
    writeDb(list);
    return list.find((a) => a.id === id);
  },
  cancel: async (id) => {
    await wait(500);
    writeDb(readDb().filter((a) => a.id !== id));
    return null;
  },
};

const api = USE_MOCK ? mockApi : realApi;

/* =====================================================================
   3) توحيد شكل الداتا — لو الباك إند بيرجّع أسماء حقول مختلفة عدّل هنا بس
   ===================================================================== */
function normalize(raw) {
  let date = raw.date;
  let time = raw.time;

  // لو الباك إند بيرجّع تاريخ ووقت في حقل واحد (ISO) نفصلهم
  const iso = raw.datetime ?? raw.startsAt;
  if ((!date || !time) && iso) {
    const d = new Date(iso);
    date = toDateInput(d);
    time = toTimeInput(d);
  }

  return {
    id: raw.id ?? raw._id,
    doctorName: raw.doctor?.name ?? raw.doctorName ?? "",
    specialty: raw.doctor?.specialty ?? raw.specialty ?? "",
    date,
    time: time?.slice(0, 5), // "10:30:00" → "10:30"
  };
}

const extractList = (res) =>
  Array.isArray(res) ? res : res?.data ?? res?.appointments ?? [];

/* =====================================================================
   4) دوال العرض
   ===================================================================== */
const toDateObj = (date, time) => new Date(`${date}T${time}`);

// "بكرة · ١٠:٣٠ ص" / "الأحد · ٤:٠٠ م"
function formatWhen(date, time) {
  const d = toDateObj(date, time);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const day = new Date(d);
  day.setHours(0, 0, 0, 0);
  const diff = Math.round((day - today) / 86400000);

  let dayLabel;
  if (diff === 0) dayLabel = "اليوم";
  else if (diff === 1) dayLabel = "بكرة";
  else if (diff > 1 && diff < 7) dayLabel = d.toLocaleDateString("ar-EG", { weekday: "long" });
  else dayLabel = d.toLocaleDateString("ar-EG", { day: "numeric", month: "long" });

  const timeLabel = d.toLocaleTimeString("ar-EG", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
  return `${dayLabel} · ${timeLabel}`;
}

// أول حرف من الاسم بعد "د."
const initialOf = (name) => name.replace(/^د\.?\s*/, "").trim().charAt(0) || "؟";

/* =====================================================================
   5) فورم التعديل (التاريخ والوقت الحاليين من الـ API لكل موعد)
   ===================================================================== */
function EditForm({ item, onSave, onClose }) {
  const [date, setDate] = useState(item.date);
  const [time, setTime] = useState(item.time);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const unchanged = date === item.date && time === item.time;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!date || !time) return setError("اختر التاريخ والوقت.");
    if (toDateObj(date, time) < new Date()) return setError("لا يمكن اختيار موعد في الماضي.");

    setSaving(true);
    setError("");
    try {
      await onSave(item.id, { date, time });
    } catch (err) {
      setError(err.message || "تعذّر حفظ التعديل.");
      setSaving(false);
    }
  };

  return (
    <form className="appt-edit" onSubmit={handleSubmit} noValidate>
      <div className="appt-edit-fields">
        <label className="appt-field">
          <span>التاريخ</span>
          <input
            type="date"
            value={date}
            min={toDateInput(new Date())}
            onChange={(e) => {
              setDate(e.target.value);
              setError("");
            }}
          />
        </label>

        <label className="appt-field">
          <span>الوقت</span>
          <input
            type="time"
            value={time}
            onChange={(e) => {
              setTime(e.target.value);
              setError("");
            }}
          />
        </label>
      </div>

      {error && (
        <p className="appt-edit-error" role="alert">
          {error}
        </p>
      )}

      <div className="appt-edit-actions">
        <button type="submit" className="btn btn-save" disabled={saving || unchanged}>
          {saving ? "جارٍ الحفظ..." : "حفظ التعديل"}
        </button>
        <button type="button" className="btn btn-outline" onClick={onClose} disabled={saving}>
          إغلاق
        </button>
      </div>
    </form>
  );
}

/* =====================================================================
   6) صف الموعد الواحد
   ===================================================================== */
function AppointmentRow({
  item,
  isEditing,
  isConfirming,
  busy,
  onEdit,
  onCancelAsk,
  onCancelConfirm,
  onCancelBack,
  onSave,
  onCloseEdit,
}) {
  return (
    <li className="appt">
      <div className="appt-main">
        <span className="appt-avatar" aria-hidden="true">
          {initialOf(item.doctorName)}
        </span>

        <div className="appt-info">
          <h3>{item.doctorName}</h3>
          <p>
            {item.specialty && `${item.specialty} · `}
            {formatWhen(item.date, item.time)}
          </p>
        </div>

        <div className="appt-actions">
          {isConfirming ? (
            <>
              <span className="appt-confirm-text">إلغاء هذا الموعد؟</span>
              <button className="btn btn-danger" onClick={() => onCancelConfirm(item.id)} disabled={busy}>
                {busy ? "جارٍ الإلغاء..." : "نعم ، إلغاء"}
              </button>
              <button className="btn btn-outline" onClick={onCancelBack} disabled={busy}>
                تراجع
              </button>
            </>
          ) : (
            <>
              <button
                className="btn btn-outline"
                onClick={() => (isEditing ? onCloseEdit() : onEdit(item.id))}
                aria-expanded={isEditing}
              >
                تعديل
              </button>
              <button className="btn btn-danger" onClick={() => onCancelAsk(item.id)}>
                إلغاء
              </button>
            </>
          )}
        </div>
      </div>

      {isEditing && <EditForm item={item} onSave={onSave} onClose={onCloseEdit} />}
    </li>
  );
}

/* =====================================================================
   7) الصفحة
   ===================================================================== */
export default function Appointments() {
  const [items, setItems] = useState([]);
  const [status, setStatus] = useState("loading"); // loading | ready | error
  const [loadError, setLoadError] = useState("");
  const [actionError, setActionError] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [confirmId, setConfirmId] = useState(null);
  const [busyId, setBusyId] = useState(null);

  // استقبال المواعيد من الـ API
  const load = useCallback(async (signal) => {
    setStatus("loading");
    setLoadError("");
    try {
      const res = await api.getAll(signal);
      setItems(extractList(res).map(normalize));
      setStatus("ready");
    } catch (err) {
      if (err.name === "AbortError") return;
      setLoadError(err.message || "تعذّر تحميل المواعيد.");
      setStatus("error");
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    load(controller.signal);
    return () => controller.abort();
  }, [load]);

  // ترتيب المواعيد من الأقرب للأبعد (أي موعد جديد بيتحط في مكانه تلقائيًا)
  const sorted = useMemo(
    () => [...items].sort((a, b) => toDateObj(a.date, a.time) - toDateObj(b.date, b.time)),
    [items]
  );

  const openEdit = (id) => {
    setActionError("");
    setConfirmId(null);
    setEditingId(id);
  };

  const askCancel = (id) => {
    setActionError("");
    setEditingId(null);
    setConfirmId(id);
  };

  // حفظ التعديل (بيرمي error لو فشل علشان الفورم يعرضه)
  const handleSave = async (id, { date, time }) => {
    await api.update(id, { date, time });
    setItems((prev) => prev.map((a) => (a.id === id ? { ...a, date, time } : a)));
    setEditingId(null);
  };

  const handleCancel = async (id) => {
    setBusyId(id);
    setActionError("");
    try {
      await api.cancel(id);
      setItems((prev) => prev.filter((a) => a.id !== id));
      setConfirmId(null);
    } catch (err) {
      setActionError(err.message || "تعذّر إلغاء الموعد.");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <main className="appts" dir="rtl">
      <header className="appts-head">
        <h1>مواعيدي</h1>
        <p>إلغاء وتعديل المواعيد</p>
      </header>

      {actionError && (
        <p className="appts-alert" role="alert">
          {actionError}
        </p>
      )}

      <section className="appts-card" aria-busy={status === "loading"}>
        {status === "loading" && (
          <ul className="appts-list" aria-label="جارٍ التحميل">
            {[1, 2].map((n) => (
              <li key={n} className="appt appt--skeleton">
                <span className="sk sk-avatar" />
                <div className="sk-lines">
                  <span className="sk sk-line" />
                  <span className="sk sk-line sk-short" />
                </div>
              </li>
            ))}
          </ul>
        )}

        {status === "error" && (
          <div className="appts-state">
            <p>{loadError}</p>
            <button className="btn btn-outline" onClick={() => load()}>
              إعادة المحاولة
            </button>
          </div>
        )}

        {status === "ready" && sorted.length === 0 && (
          <div className="appts-state">
            <p>لا توجد مواعيد قادمة.</p>
          </div>
        )}

        {status === "ready" && sorted.length > 0 && (
          <ul className="appts-list">
            {sorted.map((item) => (
              <AppointmentRow
                key={item.id}
                item={item}
                isEditing={editingId === item.id}
                isConfirming={confirmId === item.id}
                busy={busyId === item.id}
                onEdit={openEdit}
                onCloseEdit={() => setEditingId(null)}
                onCancelAsk={askCancel}
                onCancelConfirm={handleCancel}
                onCancelBack={() => setConfirmId(null)}
                onSave={handleSave}
              />
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}