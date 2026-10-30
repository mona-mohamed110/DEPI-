import { useEffect, useMemo, useRef, useState } from "react";
import { useLab } from "../../context/LabContext";
import * as api from "../../services/labApi";
import { fileType } from "../../data/labData";
import Icon from "../../components/Lab/Icon";

const key = (y, m, d) => `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;

/* ---------- منتقي التاريخ (تقويم) ---------- */
function DatePicker({ value, dates, onChange }) {
  const { t, lang, fmtDay } = useLab();
  const locale = lang === "ar" ? "ar-EG" : "en-US";
  const weekStart = lang === "ar" ? 6 : 0; // السبت في العربي، الأحد في الإنجليزي
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
    <div className="lb-dp" ref={ref}>
      <button type="button" className="lb-dp-btn" onClick={() => setOpen((o) => !o)} aria-expanded={open}>
        <Icon name="calendar" size={18} />
        <span>{value ? fmtDay(value) : t("allDays")}</span>
        {value && <span className="lb-x" role="button" aria-label="clear" onClick={(e) => { e.stopPropagation(); onChange(""); }}>×</span>}
      </button>

      {open && (
        <div className="lb-cal">
          <div className="lb-cal-top">
            <span>{value ? fmtDay(value) : new Date().toLocaleDateString(locale, { weekday: "long", day: "numeric", month: "long" })}</span>
            {value && <button type="button" onClick={() => pick(value)}>{t("allDays")}</button>}
          </div>
          <div className="lb-cal-nav">
            <b>{title}</b>
            <div>
              <button type="button" onClick={() => move(-1)} aria-label="prev"><Icon name="chevU" size={18} /></button>
              <button type="button" onClick={() => move(1)} aria-label="next"><Icon name="chevD" size={18} /></button>
            </div>
          </div>
          <div className="lb-cal-grid">
            {weekdays.map((w, i) => <div key={i} className="lb-cal-wd">{w}</div>)}
            {cells.map((c) => {
              const has = dates.includes(c.k);
              return (
                <button type="button" key={c.k} disabled={!has} onClick={() => pick(c.k)}
                  className={`lb-cal-d ${c.out ? "out" : ""} ${has ? "has" : ""} ${value === c.k ? "sel" : ""}`}>
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

/* ---------- الصفحة ---------- */
export default function ResultsLog() {
  const { t, requests, fmtDateTime, toast } = useLab();
  const [name, setName] = useState("");
  const [day, setDay] = useState("");
  const [dates, setDates] = useState([]);
  const [rows, setRows] = useState([]);

  // الأيام المحفوظة في الداتا (الأيام اللي فيها نتايج بس هي اللي تتفعل في التقويم)
  useEffect(() => { api.getResultDates().then(setDates).catch(() => {}); }, [requests]);

  // الفلترة بالاسم واليوم عن طريق الـ API
  useEffect(() => {
    let off = false;
    const h = setTimeout(() => {
      api.getResults({ name, date: day }).then((r) => !off && setRows(r)).catch(() => toast(t("error")));
    }, 250);
    return () => { off = true; clearTimeout(h); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [name, day, requests]);

  return (
    <section>
      <h1>{t("logTitle")}</h1>
      <p className="lb-sub">{t("logSub")}</p>
      <div className="lb-card">
        <div className="lb-filters">
          <div className="lb-search">
            <Icon name="search" size={18} />
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder={t("searchPh")} />
          </div>
          <DatePicker value={day} dates={dates} onChange={setDay} />
        </div>
        <div className="lb-scroll">
          <table>
            <thead><tr>
              <th>{t("orderNo")}</th><th>{t("patient")}</th><th>{t("exam")}</th><th>{t("filesCol")}</th><th>{t("uploadDate")}</th><th>{t("statusCol")}</th>
            </tr></thead>
            <tbody>
              {rows.length === 0 ? <tr><td colSpan={6} className="lb-sub">{t("noResults")}</td></tr> : rows.map((q) => (
                <tr key={q.id}>
                  <td>#{q.id}</td><td><b>{q.name}</b></td><td>{q.test}</td>
                  <td>{(q.files || []).map((f) => <span key={f} className="lb-badge" style={{ margin: "0 2px" }}>{fileType(f)}</span>)}</td>
                  <td>{fmtDateTime(q.uploadedAt)}</td>
                  <td><span className="lb-badge ok">{t("linked")}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
