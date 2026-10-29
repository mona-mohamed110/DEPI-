import { useCallback, useEffect, useState } from "react";
import { request, extractList } from "./request";

/* =====================================================================
   API — الطلبات المعلقة (عدّل المسارات حسب الباك إند)
   ===================================================================== */
const ENDPOINTS = {
  list: "/permissions/requests?status=pending",       // GET
  approve: (id) => `/permissions/requests/${id}/approve`, // POST
  reject: (id) => `/permissions/requests/${id}/reject`,   // POST
};

const api = {
  getAll: (signal) => request(ENDPOINTS.list, {}, signal),
  // الموافقة بتتبعت للـ API، والسيرفر هو اللي بيضيف الإذن في الأذونات النشطة
  approve: (id) => request(ENDPOINTS.approve(id), { method: "POST" }),
  reject: (id) => request(ENDPOINTS.reject(id), { method: "POST" }),
};

// توحيد شكل الداتا — لو أسماء الحقول عندك مختلفة عدّل هنا بس
function normalize(raw) {
  return {
    id: raw.id ?? raw._id,
    type: raw.type ?? raw.requester?.type ?? "other",
    name: raw.name ?? raw.requester?.name ?? "",
    requested: raw.requested ?? raw.scope ?? "",
    avatarUrl: raw.avatarUrl ?? null,
  };
}

const TYPE_ICONS = { doctor: "🧑‍⚕️", hospital: "🏥", lab: "🧪", radiology: "🩻", other: "📋" };

/* =====================================================================
   التاب: الطلبات المعلقة
   ===================================================================== */
export default function PendingRequests({ onPendingCountChange = () => {} }) {
  const [items, setItems] = useState([]);
  const [status, setStatus] = useState("loading"); // loading | ready | error
  const [loadError, setLoadError] = useState("");
  const [actionError, setActionError] = useState("");
  const [busy, setBusy] = useState(null); // { id, kind } أثناء الإرسال

  const load = useCallback(
    async (signal) => {
      setStatus("loading");
      setLoadError("");
      try {
        const res = await api.getAll(signal);
        const list = extractList(res).map(normalize);
        setItems(list);
        onPendingCountChange(list.length); // يحدّث الدايرة الحمرا فوق
        setStatus("ready");
      } catch (err) {
        if (err.name === "AbortError") return;
        setLoadError(err.message || "تعذّر تحميل الطلبات.");
        setStatus("error");
      }
    },
    [onPendingCountChange]
  );

  useEffect(() => {
    const controller = new AbortController();
    load(controller.signal);
    return () => controller.abort();
  }, [load]);

  // kind: "approve" | "reject"
  const handleAction = async (item, kind) => {
    setBusy({ id: item.id, kind });
    setActionError("");
    try {
      await api[kind](item.id);
      const next = items.filter((i) => i.id !== item.id);
      setItems(next);
      onPendingCountChange(next.length);
    } catch (err) {
      setActionError(err.message || "تعذّر تنفيذ العملية. حاول مرة أخرى.");
    } finally {
      setBusy(null);
    }
  };

  return (
    <>
      {actionError && (
        <p className="pm-alert" role="alert">
          {actionError}
        </p>
      )}

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
            <p>مفيش طلبات معلقة.</p>
          </div>
        )}

        {status === "ready" && items.length > 0 && (
          <ul className="pm-list">
            {items.map((item) => {
              const rowBusy = busy?.id === item.id;
              return (
                <li key={item.id} className="pm-row">
                  <span className="pm-icon" aria-hidden="true">
                    {item.avatarUrl ? <img src={item.avatarUrl} alt="" /> : TYPE_ICONS[item.type] ?? TYPE_ICONS.other}
                  </span>

                  <div className="pm-info">
                    <h3>{item.name}</h3>
                    <p>يطلب: {item.requested}</p>
                  </div>

                  <div className="pm-actions">
                    <button
                      className="pm-btn pm-btn-primary"
                      onClick={() => handleAction(item, "approve")}
                      disabled={busy !== null}
                    >
                      {rowBusy && busy.kind === "approve" ? "جارٍ..." : "موافقة"}
                    </button>
                    <button
                      className="pm-btn pm-btn-outline"
                      onClick={() => handleAction(item, "reject")}
                      disabled={busy !== null}
                    >
                      {rowBusy && busy.kind === "reject" ? "جارٍ..." : "رفض"}
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </>
  );
}
