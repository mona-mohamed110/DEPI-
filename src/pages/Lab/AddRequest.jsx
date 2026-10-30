import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useLab } from "../../context/LabContext";
import { TEST_CATALOG } from "../../data/labData";

const norm = (s) => s.replace(/[٠-٩]/g, (d) => "٠١٢٣٤٥٦٧٨٩".indexOf(d));

export default function AddRequest() {
  const { t, lang, addRequest } = useLab();
  const nav = useNavigate();
  const [f, setF] = useState({ name: "", sex: "male", age: "", phone: "", test: "" });
  const [err, setErr] = useState({});
  const [busy, setBusy] = useState(false);
  const set = (k, v) => setF((p) => ({ ...p, [k]: v }));

  const validate = () => {
    const e = {};
    const age = Number(norm(f.age));
    if (f.name.trim().length < 3) e.name = "errName";
    if (!f.age || Number.isNaN(age) || age < 0 || age > 120) e.age = "errAge";
    if (!/^01[0125]\d{8}$/.test(norm(f.phone.trim()))) e.phone = "errPhone";
    if (!f.test) e.test = "errTest";
    return e;
  };

  const submit = async (ev) => {
    ev.preventDefault();
    const e = validate();
    setErr(e);
    if (Object.keys(e).length) return;
    setBusy(true);
    const kind = TEST_CATALOG.find((x) => x.ar === f.test)?.kind || "lab";
    const r = await addRequest({ name: f.name.trim(), sex: f.sex, age: Number(norm(f.age)), phone: norm(f.phone.trim()), test: f.test, kind });
    setBusy(false);
    if (r) nav("/lab");
  };

  const label = (x) => (lang === "ar" ? x.ar : x.en);
  const Err = ({ k }) => (err[k] ? <div className="lb-err">{t(err[k])}</div> : null);

  return (
    <section>
      <h1>{t("addTitle")}</h1>
      <p className="lb-sub">{t("addSub")}</p>
      <form className="lb-card lb-form" onSubmit={submit} noValidate>
        <div className="lb-full">
          <label>{t("fName")}</label>
          <input value={f.name} onChange={(e) => set("name", e.target.value)} placeholder={t("namePh")} />
          <Err k="name" />
        </div>
        <div>
          <label>{t("fSex")}</label>
          <div className="lb-chips">
            {["male", "female"].map((s) => (
              <button type="button" key={s} className={`lb-chip ${f.sex === s ? "on" : ""}`} onClick={() => set("sex", s)}>{t(s)}</button>
            ))}
          </div>
        </div>
        <div>
          <label>{t("fAge")}</label>
          <input inputMode="numeric" value={f.age} onChange={(e) => set("age", e.target.value)} />
          <Err k="age" />
        </div>
        <div>
          <label>{t("fPhone")}</label>
          <input dir="ltr" inputMode="tel" value={f.phone} onChange={(e) => set("phone", e.target.value)} placeholder="01xxxxxxxxx" />
          <Err k="phone" />
        </div>
        <div>
          <label>{t("fTest")}</label>
          <select value={f.test} onChange={(e) => set("test", e.target.value)}>
            <option value="">{t("chooseTest")}</option>
            <optgroup label={t("labTests")}>
              {TEST_CATALOG.filter((x) => x.kind === "lab").map((x) => <option key={x.ar} value={x.ar}>{label(x)}</option>)}
            </optgroup>
            <optgroup label={t("xrays")}>
              {TEST_CATALOG.filter((x) => x.kind === "xray").map((x) => <option key={x.ar} value={x.ar}>{label(x)}</option>)}
            </optgroup>
          </select>
          <Err k="test" />
        </div>
        <div className="lb-full" style={{ marginTop: 18 }}>
          <button type="submit" className="lb-btn" disabled={busy}>{busy ? t("loading") : t("submitAdd")}</button>
        </div>
      </form>
    </section>
  );
}
