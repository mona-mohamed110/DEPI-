import { useEffect, useState } from "react";
import { useLab } from "../../context/LabContext";
import * as api from "../../services/labApi";

export default function LabAccount() {
  const { t, toast } = useLab();
  const [m, setM] = useState(null);
  const [pw, setPw] = useState({ cur: "", next: "", conf: "" });
  const [err, setErr] = useState(false);

  useEffect(() => { api.getMe().then(setM).catch(() => toast(t("error"))); /* eslint-disable-next-line */ }, []);
  if (!m) return <p className="lb-sub">{t("loading")}</p>;

  const flip = async (k) => {
    const n = { ...m, [k]: !m[k] };
    setM(n);
    try { await api.updateMe(n); } catch { toast(t("error")); }
  };
  const change = async (e) => {
    e.preventDefault();
    if (pw.next.length < 8 || pw.next !== pw.conf || !pw.cur) return setErr(true);
    setErr(false);
    try { await api.changePassword(pw.cur, pw.next); setPw({ cur: "", next: "", conf: "" }); toast(t("passChanged")); }
    catch { toast(t("error")); }
  };

  return (
    <section>
      <h1>{t("accTitle")}</h1>
      <p className="lb-sub">{t("accSub")}</p>
      <div className="lb-grid lb-g2">
        <form className="lb-card" onSubmit={change}>
          <label className="lb-first">{t("curPass")}</label>
          <input type="password" autoComplete="current-password" value={pw.cur} onChange={(e) => setPw({ ...pw, cur: e.target.value })} />
          <label>{t("newPass")}</label>
          <input type="password" autoComplete="new-password" value={pw.next} onChange={(e) => setPw({ ...pw, next: e.target.value })} />
          <label>{t("confirmPass")}</label>
          <input type="password" autoComplete="new-password" value={pw.conf} onChange={(e) => setPw({ ...pw, conf: e.target.value })} />
          {err && <div className="lb-err">{t("passMismatch")}</div>}
          <div style={{ marginTop: 16 }}><button type="submit" className="lb-btn">{t("changePass")}</button></div>
        </form>
        <div className="lb-card">
          <h2>{t("notifications")}</h2>
          {[["notifNew", "notifNew"], ["notifSms", "notifSms"]].map(([k, l]) => (
            <div className="lb-row" key={k}>
              <span className="lb-m">{t(l)}</span>
              <button type="button" className={`lb-sw ${m[k] ? "on" : ""}`} onClick={() => flip(k)} aria-label={t(l)} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
