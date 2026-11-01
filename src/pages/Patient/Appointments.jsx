import { useCallback, useEffect, useMemo, useState } from "react";
import "../../components/Style/Patient/Appointments.css";
import usePatientPrefs from "../../components/Patient/usePatientPrefs";

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
    let message = "";
    try {
      message = (await res.json()).message || "";
    } catch {
      /* الرد مش JSON */
    }
    const error = new Error(message);
    error.fromApi = Boolean(message); // لو false بنعرض رسالة مترجمة بدل النص ده
    throw error;
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
function formatWhen(date, time, { t, locale }) {
  const d = toDateObj(date, time);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const day = new Date(d);
  day.setHours(0, 0, 0, 0);
  const diff = Math.round((day - today) / 86400000);

  let dayLabel;
  if (diff === 0) dayLabel = t("today");
  else if (diff === 1) dayLabel = t("tomorrow");
  else if (diff > 1 && diff < 7) dayLabel = d.toLocaleDateString(locale, { weekday: "long" });
  else dayLabel = d.toLocaleDateString(locale, { day: "numeric", month: "long" });

  const timeLabel = d.toLocaleTimeString(locale, {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
  return `${dayLabel} · ${timeLabel}`;
}

// أول حرف من الاسم بعد "د."
const initialOf = (name) => name.replace(/^(د\.?|dr\.?)\s*/i, "").trim().charAt(0).toUpperCase() || "?";

// رسالة الخطأ: لو جاية من الـ API نعرضها، غير كده نعرض النص المترجم
const errText = (err, fallback) => (err?.fromApi ? err.message : fallback);

/* =====================================================================
   5) فورم التعديل (التاريخ والوقت الحاليين من الـ API لكل موعد)
   ===================================================================== */
function EditForm({ item, onSave, onClose, prefs }) {
  const { t } = prefs;
  const [date, setDate] = useState(item.date);
  const [time, setTime] = useState(item.time);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const unchanged = date === item.date && time === item.time;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!date || !time) return setError(t("ap_pick_dt"));
    if (toDateObj(date, time) < new Date()) return setError(t("ap_past"));

    setSaving(true);
    setError("");
    try {
      await onSave(item.id, { date, time });
    } catch (err) {
      setError(errText(err, t("ap_err_save")));
      setSaving(false);
    }
  };

  return (
    <form className="appt-edit" onSubmit={handleSubmit} noValidate>
      <div className="appt-edit-fields">
        <label className="appt-field">
          <span>{t("ap_date")}</span>
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
          <span>{t("ap_time")}</span>
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
          {saving ? t("ap_saving") : t("ap_save")}
        </button>
        <button type="button" className="btn btn-outline" onClick={onClose} disabled={saving}>
          {t("ap_close")}
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
  prefs,
}) {
  const { t } = prefs;
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
            {formatWhen(item.date, item.time, prefs)}
          </p>
        </div>

        <div className="appt-actions">
          {isConfirming ? (
            <>
              <span className="appt-confirm-text">{t("ap_cancel_q")}</span>
              <button className="btn btn-danger" onClick={() => onCancelConfirm(item.id)} disabled={busy}>
                {busy ? t("ap_cancelling") : t("ap_cancel_yes")}
              </button>
              <button className="btn btn-outline" onClick={onCancelBack} disabled={busy}>
                {t("ap_back")}
              </button>
            </>
          ) : (
            <>
              <button
                className="btn btn-outline"
                onClick={() => (isEditing ? onCloseEdit() : onEdit(item.id))}
                aria-expanded={isEditing}
              >
                {t("ap_edit")}
              </button>
              <button className="btn btn-danger" onClick={() => onCancelAsk(item.id)}>
                {t("ap_cancel")}
              </button>
            </>
          )}
        </div>
      </div>

      {isEditing && <EditForm item={item} onSave={onSave} onClose={onCloseEdit} prefs={prefs} />}
    </li>
  );
}

/* =====================================================================
   7) الصفحة
   ===================================================================== */
export default function Appointments() {
  const prefs = usePatientPrefs();
  const { t } = prefs;
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
      setLoadError(errText(err, ""));
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
      setActionError(errText(err, t("ap_err_cancel")));
    } finally {
      setBusyId(null);
    }
  };

  return (
    <main className="appts" dir={prefs.dir} data-theme={prefs.theme}>
      <header className="appts-head">
        <h1>{t("ap_title")}</h1>
        <p>{t("ap_sub")}</p>
      </header>

      {actionError && (
        <p className="appts-alert" role="alert">
          {actionError}
        </p>
      )}

      <section className="appts-card" aria-busy={status === "loading"}>
        {status === "loading" && (
          <ul className="appts-list" aria-label={t("ap_loading")}>
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
            <p>{loadError || t("ap_load_err")}</p>
            <button className="btn btn-outline" onClick={() => load()}>
              {t("ap_retry")}
            </button>
          </div>
        )}

        {status === "ready" && sorted.length === 0 && (
          <div className="appts-state">
            <p>{t("ap_empty")}</p>
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
                prefs={prefs}
              />
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}