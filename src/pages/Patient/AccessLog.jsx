import { useCallback, useEffect, useMemo, useState } from "react";
import { request, extractList, loc, errText } from "./request";
import usePatientPrefs from "../../components/Patient/usePatientPrefs";

/* =====================================================================
   API — سجل الوصول (قراءة فقط) — عدّل المسار حسب الباك إند
   ===================================================================== */
const ENDPOINTS = {
  list: "/permissions/log", // GET
};

const api = {
  getAll: (signal) => request(ENDPOINTS.list, {}, signal),
};

// توحيد شكل الداتا — لو أسماء الحقول عندك مختلفة عدّل هنا بس
function normalize(raw) {
  return {
    id: raw.id ?? raw._id,
    name: raw.name ?? raw.actor?.name ?? "",
    nameEn: raw.nameEn ?? raw.name_en ?? null,
    action: raw.action ?? "",
    actionEn: raw.actionEn ?? raw.action_en ?? null,
    at: raw.at ?? raw.createdAt ?? raw.created_at,
  };
}

/* =====================================================================
   دوال العرض: "اليوم ٩:١٥ ص" / "أمس ٦:٣٠ م" / "٢٥ أكتوبر ١١:٠٠ ص"
   ===================================================================== */
function formatWhen(iso, { t, locale }) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const day = new Date(d);
  day.setHours(0, 0, 0, 0);
  const diff = Math.round((today - day) / 86400000);

  let dayLabel;
  if (diff === 0) dayLabel = t("today");
  else if (diff === 1) dayLabel = t("pm_yesterday");
  else dayLabel = d.toLocaleDateString(locale, { day: "numeric", month: "long" });

  const timeLabel = d.toLocaleTimeString(locale, { hour: "numeric", minute: "2-digit", hour12: true });
  return `${dayLabel} ${timeLabel}`;
}

/* =====================================================================
   التاب: سجل الوصول
   ===================================================================== */
export default function AccessLog() {
  const prefs = usePatientPrefs();
  const { t, lang } = prefs;
  const [items, setItems] = useState([]);
  const [status, setStatus] = useState("loading"); // loading | ready | error
  const [loadError, setLoadError] = useState("");

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

  // الأحدث أولًا
  const sorted = useMemo(() => [...items].sort((a, b) => new Date(b.at) - new Date(a.at)), [items]);

  return (
    <section className="pm-card" aria-busy={status === "loading"}>
      {status === "loading" && (
        <ul className="pm-list" aria-label={t("pm_loading")}>
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
          <p>{loadError || t("pm_err_load_log")}</p>
          <button className="pm-btn pm-btn-outline" onClick={() => load()}>
            {t("pm_retry")}
          </button>
        </div>
      )}

      {status === "ready" && sorted.length === 0 && (
        <div className="pm-state">
          <p>{t("pm_log_empty")}</p>
        </div>
      )}

      {status === "ready" && sorted.length > 0 && (
        <ul className="pm-list">
          {sorted.map((item) => (
            <li key={item.id} className="pm-row">
              <span className="pm-icon" aria-hidden="true">
                🕒
              </span>

              <div className="pm-info">
                <h3>{loc(item, "name", lang)}</h3>
                <p>{loc(item, "action", lang)}</p>
              </div>

              <time className="pm-time" dateTime={item.at}>
                {formatWhen(item.at, prefs)}
              </time>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
