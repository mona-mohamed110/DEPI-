import { useEffect, useState } from "react";
import { useLab } from "./LabContext.jsx";
import Icon from "../../components/Icon.jsx";
import MapArt from "../../components/ui/MapArt.jsx";
import { useAuth } from "../../context/AuthContext.jsx";
import * as api from "../../api/lab.js";

export default function LabProfile() {
  const { t, L, testName, toast } = useLab();
  const { user } = useAuth();
  const [p, setP] = useState(null);
  const [newTest, setNewTest] = useState("");

  useEffect(() => { api.getLabProfile().then(setP).catch(() => toast(t("error"))); /* eslint-disable-next-line */ }, []);
  if (!p) return <p className="sub">{t("loading")}</p>;

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
      <p className="sub">{t("lpSub")}</p>
      <div className="grid g2">
        <div className="card">
          <div className="row" style={{ border: 0 }}>
            <div className="ty" style={{ width: 56, height: 56, fontSize: 26 }}><Icon name="building" size={26} /></div>
            <div className="m"><b style={{ fontSize: 18 }}>{L(user.name)}</b><small>{t("licensed", { n: p.license })}</small></div>
            <span className="badge ok"><Icon name="check" size={14} />{t("approved")}</span>
          </div>
          <label>{t("address")}</label>
          <input value={L(p.address)} onChange={(e) => set("address", e.target.value)} />
          <label>{t("labPhone")}</label>
          <input dir="ltr" value={p.phone} onChange={(e) => set("phone", e.target.value)} />
          <MapArt />
        </div>

        <div className="card">
          <h2>{t("workHours")}</h2>
          {t("days").map((d, i) => (
            <div className="row" key={d}>
              <button type="button" className={`sw ${p.hours[i].on ? "on" : ""}`} onClick={() => setDay(i, { on: !p.hours[i].on })} aria-label={d} />
              <b className="day-name">{d}</b>
              <input type="time" value={p.hours[i].from} disabled={!p.hours[i].on} onChange={(e) => setDay(i, { from: e.target.value })} className="time" />
              <span>{t("to")}</span>
              <input type="time" value={p.hours[i].to} disabled={!p.hours[i].on} onChange={(e) => setDay(i, { to: e.target.value })} className="time" />
            </div>
          ))}
          <h2 style={{ marginTop: 20 }}>{t("availableTests")}</h2>
          <div className="chips">
            {p.tests.map((x, i) => <button type="button" key={x.name} className={`chip ${x.on ? "on" : ""}`} onClick={() => toggleTest(i)}>{testName(x.name)}</button>)}
          </div>
          <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
            <input value={newTest} onChange={(e) => setNewTest(e.target.value)} onKeyDown={(e) => e.key === "Enter" && addTest()} placeholder={t("newTest")} />
            <button type="button" className="btn" onClick={addTest}>{t("add")}</button>
          </div>
          <div style={{ marginTop: 16 }}><button type="button" className="btn" onClick={save}>{t("save")}</button></div>
        </div>
      </div>
    </section>
  );
}
