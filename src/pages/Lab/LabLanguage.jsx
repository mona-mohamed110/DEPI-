import { useLab } from "../../context/LabContext";

export default function LabLanguage() {
  const { t, lang, setLang } = useLab();
  const opts = [["ar", "arabic", "ع"], ["en", "english", "En"]];
  return (
    <section>
      <h1>{t("langTitle")}</h1>
      <p className="lb-sub">{t("langSub")}</p>
      <div className="lb-grid lb-g2 lb-narrow">
        {opts.map(([v, k, ic]) => (
          <button type="button" key={v} className={`lb-opt ${lang === v ? "on" : ""}`} onClick={() => setLang(v)}>
            <span className="lb-opt-ic">{ic}</span><b>{t(k)}</b>
          </button>
        ))}
      </div>
    </section>
  );
}
