import { useLab } from "../../context/LabContext";
import Icon from "../../components/Lab/Icon";

export default function LabLanguage() {
  const { t, lang, setLang } = useLab();
  const opts = [["ar", "arabic"], ["en", "english"]];
  return (
    <section>
      <h1>{t("langTitle")}</h1>
      <p className="lb-sub">{t("langSub")}</p>
      <div className="lb-grid lb-g2 lb-narrow">
        {opts.map(([v, k]) => (
          <button type="button" key={v} className={`lb-opt ${lang === v ? "on" : ""}`} onClick={() => setLang(v)}>
            <span className="lb-opt-ic"><Icon name="languages" size={22} /></span><b>{t(k)}</b>
          </button>
        ))}
      </div>
    </section>
  );
}
