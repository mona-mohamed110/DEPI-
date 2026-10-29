import { useCallback, useEffect, useRef, useState } from "react";
import { request, extractList } from "./request";

/* =====================================================================
   API — الأذونات النشطة (عدّل المسارات حسب الباك إند)
   ===================================================================== */
const ENDPOINTS = {
  list: "/permissions/active",                       // GET
  revoke: (id) => `/permissions/${id}`,              // DELETE
  revokeAll: "/permissions/revoke-all",              // POST
};

const api = {
  getAll: (signal) => request(ENDPOINTS.list, {}, signal),
  revoke: (id) => request(ENDPOINTS.revoke(id), { method: "DELETE" }),
  revokeAll: () => request(ENDPOINTS.revokeAll, { method: "POST" }),
};

// توحيد شكل الداتا — لو أسماء الحقول عندك مختلفة عدّل هنا بس
function normalize(raw) {
  return {
    id: raw.id ?? raw._id,
    type: raw.type ?? raw.grantee?.type ?? "other",
    name: raw.name ?? raw.grantee?.name ?? "",
    accessLevel: raw.accessLevel ?? raw.level ?? "",
    expiresAt: raw.expiresAt ?? raw.expires_at ?? null, // null = دائم
    avatarUrl: raw.avatarUrl ?? null,
  };
}

/* =====================================================================
   دوال العرض
   ===================================================================== */
const TYPE_ICONS = { doctor: "🧑‍⚕️", hospital: "🏥", lab: "🧪", radiology: "🩻", other: "📋" };

const parseDate = (s) => (/^\d{4}-\d{2}-\d{2}$/.test(s) ? new Date(`${s}T00:00:00`) : new Date(s));

function expiryText(expiresAt) {
  if (!expiresAt) return "دائم";
  const d = parseDate(expiresAt);
  if (Number.isNaN(d.getTime())) return "";
  const sameYear = d.getFullYear() === new Date().getFullYear();
  return (
    "لحد " +
    d.toLocaleDateString("ar-EG", {
      day: "numeric",
      month: "long",
      ...(sameYear ? {} : { year: "numeric" }),
    })
  );
}

/* =====================================================================
   مربع التأكيد (تأكيد / إلغاء)
   ===================================================================== */
function ConfirmDialog({ title, message, confirmLabel, busy, error, onConfirm, onCancel }) {
  const ref = useRef(null);

  // يرجّع التركيز للزرار اللي فتح المربع بعد ما يتقفل
  useEffect(() => {
    const previous = document.activeElement;
    return () => previous?.focus?.();
  }, []);

  const handleKeyDown = (e) => {
    if (e.key === "Escape" && !busy) {
      onCancel();
    } else if (e.key === "Tab") {
      // حبس التركيز جوه المربع
      const buttons = ref.current.querySelectorAll("button:not(:disabled)");
      if (!buttons.length) return;
      const first = buttons[0];
      const last = buttons[buttons.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  };

  return (
    <div
      className="pm-overlay"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && !busy) onCancel();
      }}
    >
      <div
        ref={ref}
        className="pm-dialog"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="pm-dlg-title"
        aria-describedby="pm-dlg-msg"
        onKeyDown={handleKeyDown}
      >
        <h2 id="pm-dlg-title">{title}</h2>
        <p id="pm-dlg-msg">{message}</p>
        {error && (
          <p className="pm-dialog-error" role="alert">
            {error}
          </p>
        )}
        <div className="pm-dialog-actions">
          {/* التركيز الافتراضي على "إلغاء" علشان Enter بالغلط ما يسحبش حاجة */}
          <button type="button" className="pm-btn pm-btn-outline" onClick={onCancel} disabled={busy} autoFocus>
            إلغاء
          </button>
          <button type="button" className="pm-btn pm-btn-danger" onClick={onConfirm} disabled={busy}>
            {busy ? "جارٍ السحب..." : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

/* =====================================================================
   التاب: الأذونات النشطة
   ===================================================================== */
export default function ActivePermissions() {
  const [items, setItems] = useState([]);
  const [status, setStatus] = useState("loading"); // loading | ready | error
  const [loadError, setLoadError] = useState("");
  const [confirm, setConfirm] = useState(null); // { mode: "one", item } | { mode: "all" }
  const [busy, setBusy] = useState(false);
  const [dialogError, setDialogError] = useState("");

  const load = useCallback(async (signal) => {
    setStatus("loading");
    setLoadError("");
    try {
      const res = await api.getAll(signal);
      setItems(extractList(res).map(normalize));
      setStatus("ready");
    } catch (err) {
      if (err.name === "AbortError") return;
      setLoadError(err.message || "تعذّر تحميل الأذونات.");
      setStatus("error");
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    load(controller.signal);
    return () => controller.abort();
  }, [load]);

  const closeDialog = () => {
    setConfirm(null);
    setDialogError("");
  };

  const handleConfirm = async () => {
    setBusy(true);
    setDialogError("");
    try {
      if (confirm.mode === "all") {
        await api.revokeAll();
        setItems([]); // يشيل كل الأذونات النشطة
      } else {
        await api.revoke(confirm.item.id);
        setItems((prev) => prev.filter((i) => i.id !== confirm.item.id));
      }
      closeDialog();
    } catch (err) {
      setDialogError(err.message || "تعذّر سحب الإذن. حاول مرة أخرى.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <section className="pm-card" aria-busy={status === "loading"}>
        {status === "loading" && (
          <ul className="pm-list" aria-label="جارٍ التحميل">
            {[1, 2, 3].map((n) => (
              <li key={n} className="pm-row pm-row--skeleton">
                <span className="pm-sk pm-sk-icon" />
                <div className="pm-sk-lines">
                  <span className="pm-sk pm-sk-line" />
                  <span className="pm-sk pm-sk-line pm-sk-short" />
                </div>
              </li>
            ))}
          </ul>
        )}

        {status === "error" && (
          <div className="pm-state">
            <p>{loadError}</p>
            <button className="pm-btn pm-btn-outline" onClick={() => load()}>
              إعادة المحاولة
            </button>
          </div>
        )}

        {status === "ready" && items.length === 0 && (
          <div className="pm-state">
            <p>مفيش أذونات نشطة حاليًا.</p>
          </div>
        )}

        {status === "ready" && items.length > 0 && (
          <ul className="pm-list">
            {items.map((item) => (
              <li key={item.id} className="pm-row">
                <span className="pm-icon" aria-hidden="true">
                  {item.avatarUrl ? <img src={item.avatarUrl} alt="" /> : TYPE_ICONS[item.type] ?? TYPE_ICONS.other}
                </span>

                <div className="pm-info">
                  <h3>{item.name}</h3>
                  <p>{[item.accessLevel, expiryText(item.expiresAt)].filter(Boolean).join(" · ")}</p>
                </div>

                <div className="pm-actions">
                  <span className="pm-pill-active">نشط</span>
                  <button className="pm-btn pm-btn-danger" onClick={() => setConfirm({ mode: "one", item })}>
                    سحب الإذن
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* ظاهر في هذا التاب فقط */}
      <section className="pm-danger" aria-labelledby="pm-danger-title">
        <div>
          <h2 id="pm-danger-title">سحب كل الأذونات فوراً</h2>
          <p>هيتقفل الوصول لملفك عن الجميع في نفس اللحظة</p>
        </div>
        <button
          className="pm-btn pm-btn-danger pm-btn-lg"
          onClick={() => setConfirm({ mode: "all" })}
          disabled={status !== "ready" || items.length === 0}
        >
          سحب الإذن فوراً
        </button>
      </section>

      {confirm && (
        <ConfirmDialog
          title={confirm.mode === "all" ? "سحب كل الأذونات؟" : "سحب الإذن؟"}
          message={
            confirm.mode === "all"
              ? `هيتم سحب كل الأذونات النشطة (${items.length}) وهيتقفل الوصول لملفك عن الجميع فوراً.`
              : `هيتقفل وصول ${confirm.item.name} لملفك الطبي فوراً.`
          }
          confirmLabel={confirm.mode === "all" ? "نعم، اسحب الكل" : "نعم، اسحب الإذن"}
          busy={busy}
          error={dialogError}
          onConfirm={handleConfirm}
          onCancel={closeDialog}
        />
      )}
    </>
  );
}
