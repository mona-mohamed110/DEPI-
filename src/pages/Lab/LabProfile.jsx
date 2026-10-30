import { useEffect, useState } from "react";
import { useLab } from "../../context/LabContext";
import * as api from "../../services/labApi";

export default function LabProfile() {
  const { t, toast } = useLab();
  const [p, setP] = useState(null);
  const [newTest, setNewTest] = useState("");

  useEffect(() => { api.getLabProfile().then(setP).catch(() => toast(t("error"))); /* eslint-disable-next-line */ }, []);
  if (!p) return <p className="lb-sub">{t("loading")}</p>;

  const set = (k, v) => setP((x) => ({ ...x, [k]: v }));
  const setDay = (i, patch) => set("hours", p.hours.map((h, j) => (j === i ? { ...h, ...patch } : h)));
  const toggleTest = (i) => set("tests", p.tests.map((x, j) => (j === i ? { ...x, on: !x.on } : x)));
  const addTest = () => {
    const v = newTest.trim();
    if (!v) return;
    set("tests", [...p.tests, { name: v, on: true }]);
    setNewTest("");
  };
  const save = async () => {
    try { await api.updateLabProfile(p); toast(t("saved")); } catch { toast(t("error")); }
  };

  return (
    <section>
      <h1>{t("lpTitle")}</h1>
      <p className="lb-sub">{t("lpSub")}</p>
      <div className="lb-grid lb-g2">
        <div className="lb-card">
          <div className="lb-row" style={{ border: 0 }}>
            <div className="lb-ty" style={{ width: 56, height: 56, fontSize: 26 }}>🏥</div>
            <div className="lb-m"><b style={{ fontSize: 18 }}>{p.name}</b><small>{t("licensed", { n: p.license })}</small></div>
            <span className="lb-badge ok">{t("approved")}</span>
          </div>
          <label>{t("address")}</label>
          <input value={p.address} onChange={(e) => set("address", e.target.value)} />
          <label>{t("labPhone")}</label>
          <input dir="ltr" value={p.phone} onChange={(e) => set("phone", e.target.value)} />
          <div className="lb-map">
            <svg width="100%" height="100%" viewBox="0 0 400 170" preserveAspectRatio="xMidYMid slice">
              <path d="M0 100 L400 60" stroke="#fff" strokeWidth="14" /><path d="M160 0 L220 170" stroke="#fff" strokeWidth="10" />
              <rect x="250" y="90" width="60" height="40" rx="6" fill="#d7e5f8" /><rect x="40" y="110" width="70" height="40" rx="6" fill="#d7e5f8" />
              <path d="M200 44 a14 14 0 1 1 .1 0 l-.1 0 -14 28 z" fill="#2563eb" /><circle cx="200" cy="40" r="5" fill="#fff" />
            </svg>
          </div>
        </div>

        <div className="lb-card">
          <h2>{t("workHours")}</h2>
          {t("days").map((d, i) => (
            <div className="lb-row" key={d}>
              <button type="button" className={`lb-sw ${p.hours[i].on ? "on" : ""}`} onClick={() => setDay(i, { on: !p.hours[i].on })} aria-label={d} />
              <b className="lb-day">{d}</b>
              <input type="time" value={p.hours[i].from} disabled={!p.hours[i].on} onChange={(e) => setDay(i, { from: e.target.value })} className="lb-time" />
              <span>{t("to")}</span>
              <input type="time" value={p.hours[i].to} disabled={!p.hours[i].on} onChange={(e) => setDay(i, { to: e.target.value })} className="lb-time" />
            </div>
          ))}
          <h2 style={{ marginTop: 20 }}>{t("availableTests")}</h2>
          <div className="lb-chips">
            {p.tests.map((x, i) => <button type="button" key={x.name} className={`lb-chip ${x.on ? "on" : ""}`} onClick={() => toggleTest(i)}>{x.name}</button>)}
          </div>
          <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
            <input value={newTest} onChange={(e) => setNewTest(e.target.value)} onKeyDown={(e) => e.key === "Enter" && addTest()} placeholder={t("newTest")} />
            <button type="button" className="lb-btn" onClick={addTest}>{t("add")}</button>
          </div>
          <div style={{ marginTop: 16 }}><button type="button" className="lb-btn" onClick={save}>{t("save")}</button></div>
        </div>
      </div>
    </section>
  );
}
