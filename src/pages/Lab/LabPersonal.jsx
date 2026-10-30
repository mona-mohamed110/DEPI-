import { useEffect, useState } from "react";
import { useLab } from "../../context/LabContext";
import * as api from "../../services/labApi";

export default function LabPersonal() {
  const { t, toast } = useLab();
  const [m, setM] = useState(null);
  useEffect(() => { api.getMe().then(setM).catch(() => toast(t("error"))); /* eslint-disable-next-line */ }, []);
  if (!m) return <p className="lb-sub">{t("loading")}</p>;
  const set = (k, v) => setM((x) => ({ ...x, [k]: v }));
  const save = async (e) => {
    e.preventDefault();
    try { await api.updateMe(m); toast(t("saved")); } catch { toast(t("error")); }
  };
  return (
    <section>
      <h1>{t("personalTitle")}</h1>
      <p className="lb-sub">{t("personalSub")}</p>
      <form className="lb-card lb-narrow" onSubmit={save}>
        <div className="lb-avatar">{(m.name || "?").trim().charAt(0)}</div>
        <label>{t("name")}</label><input value={m.name} onChange={(e) => set("name", e.target.value)} />
        <label>{t("email")}</label><input type="email" dir="ltr" value={m.email} onChange={(e) => set("email", e.target.value)} />
        <label>{t("phone")}</label><input dir="ltr" value={m.phone} onChange={(e) => set("phone", e.target.value)} />
        <div style={{ marginTop: 16 }}><button type="submit" className="lb-btn">{t("save")}</button></div>
      </form>
    </section>
  );
}
