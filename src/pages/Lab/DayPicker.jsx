import { useEffect, useMemo, useRef, useState } from "react";
import { useLab } from "./LabContext.jsx";
import { dayKey } from "../../api/lab.js";
import Icon from "../../components/Icon.jsx";

const key = (y, m, d) => `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;

/* ---------- منتقي التاريخ (تقويم) ---------- */
export default function DayPicker({ value, dates, onChange }) {
  const { t, lang, fmtDay } = useLab();
  const locale = lang === "ar" ? "ar-EG" : "en-US";
  const weekStart = lang === "ar" ? 6 : 0; // السبت في العربي، الأحد في الإنجليزي
  const todayKey = dayKey(new Date().toISOString());
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const base = value || dates[0];
  const init = base ? new Date(`${base}T00:00:00`) : new Date();
  const [view, setView] = useState({ y: init.getFullYear(), m: init.getMonth() });

  useEffect(() => {
    const off = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", off);
    return () => document.removeEventListener("mousedown", off);
  }, []);

  const cells = useMemo(() => {
    const first = new Date(view.y, view.m, 1);
    const offset = (first.getDay() - weekStart + 7) % 7;
    return Array.from({ length: 42 }, (_, i) => {
      const d = new Date(view.y, view.m, 1 - offset + i);
      return { k: key(d.getFullYear(), d.getMonth(), d.getDate()), n: d.getDate(), out: d.getMonth() !== view.m };
    });
  }, [view, weekStart]);

  const weekdays = Array.from({ length: 7 }, (_, i) =>
    new Date(2026, 0, 4 + ((weekStart + i) % 7)).toLocaleDateString(locale, { weekday: "narrow" }));
  const title = new Date(view.y, view.m, 1).toLocaleDateString(locale, { month: "long", year: "numeric" });
  const move = (n) => setView((v) => { const d = new Date(v.y, v.m + n, 1); return { y: d.getFullYear(), m: d.getMonth() }; });
  const pick = (k) => { onChange(k === value ? "" : k); setOpen(false); };

  return (
    <div className="dp" ref={ref}>
      <button type="button" className="dp-btn" onClick={() => setOpen((o) => !o)} aria-expanded={open}>
        <Icon name="calendar" size={18} />
        <span>{value ? fmtDay(value) : t("allDays")}</span>
        {value && <span className="x" role="button" aria-label="clear" onClick={(e) => { e.stopPropagation(); onChange(""); }}><Icon name="x" size={16} /></span>}
      </button>

      {open && (
        <div className="cal">
          <div className="cal-top">
            <span>{value ? fmtDay(value) : new Date().toLocaleDateString(locale, { weekday: "long", day: "numeric", month: "long" })}</span>
            <span>
              {value !== todayKey && <button type="button" onClick={() => pick(todayKey)}>{t("dpToday")}</button>}
              {value && <button type="button" onClick={() => onChange("")}>{t("allDays")}</button>}
            </span>
          </div>
          <div className="cal-nav">
            <b>{title}</b>
            <div>
              <button type="button" onClick={() => move(-1)} aria-label="prev"><Icon name="chevU" size={18} /></button>
              <button type="button" onClick={() => move(1)} aria-label="next"><Icon name="chevD" size={18} /></button>
            </div>
          </div>
          <div className="cal-grid">
            {weekdays.map((w, i) => <div key={i} className="cal-wd">{w}</div>)}
            {cells.map((c) => {
              const has = dates.includes(c.k) || c.k === todayKey;
              return (
                <button type="button" key={c.k} disabled={!has} onClick={() => pick(c.k)}
                  className={`cal-d ${c.out ? "out" : ""} ${has ? "has" : ""} ${value === c.k ? "sel" : ""}`}>
                  {c.n.toLocaleString(locale)}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

