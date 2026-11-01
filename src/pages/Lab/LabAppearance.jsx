import { useLab } from "../../context/LabContext";
import Icon from "../../components/Lab/Icon";

export default function LabAppearance() {
  const { t, theme, setTheme } = useLab();
  const opts = [["light", "light", "sun"], ["dark", "dark", "moon"]];
  return (
    <section>
      <h1>{t("themeTitle")}</h1>
      <p className="lb-sub">{t("themeSub")}</p>
      <div className="lb-grid lb-g2 lb-narrow">
        {opts.map(([v, k, ic]) => (
          <button type="button" key={v} className={`lb-opt ${theme === v ? "on" : ""}`} onClick={() => setTheme(v)}>
            <span className="lb-opt-ic"><Icon name={ic} size={22} /></span><b>{t(k)}</b>
          </button>
        ))}
      </div>
    </section>
  );
}
