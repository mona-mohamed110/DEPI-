import { useApp } from "../../context/AppContext.jsx";
import "../../components/Style/Patient/Results.css";

const STATUS_KEYS = {
  normal: "res_normal",
  low: "res_low",
  followup: "res_followup",
};

const RESULTS = [
  {
    id: 1,
    icon: "🧪",
    titleKey: "res_1_title",
    metaKey: "res_1_meta",
    status: "normal",
    pdfUrl: "/sample.pdf",
  },
  {
    id: 2,
    icon: "🧪",
    titleKey: "res_2_title",
    metaKey: "res_2_meta",
    status: "low",
    pdfUrl: "/sample.pdf",
  },
  {
    id: 3,
    icon: "🩻",
    titleKey: "res_3_title",
    metaKey: "res_3_meta",
    status: "normal",
    pdfUrl: "/sample.pdf",
  },
  {
    id: 4,
    icon: "🫀",
    titleKey: "res_4_title",
    metaKey: "res_4_meta",
    status: "followup",
    pdfUrl: "/sample.pdf",
  },
];

export default function Results() {
  const { t, theme } = useApp();

  return (
    <section className={`results results--${theme}`}>
      <header className="results__header">
        <h1 className="results__title">{t("res_title")}</h1>
        <p className="results__subtitle">{t("res_sub")}</p>
      </header>

      <div className="results__card">
        <ul className="results__list">
          {RESULTS.map((item) => (
            <li className="results__row" key={item.id}>
              <div className="results__info">
                <span className="results__icon" aria-hidden="true">
                  {item.icon}
                </span>
                <div className="results__text">
                  <h2 className="results__name">{t(item.titleKey)}</h2>
                  <p className="results__meta">{t(item.metaKey)}</p>
                </div>
              </div>

              <div className="results__actions">
                <span
                  className={`results__badge results__badge--${item.status}`}
                >
                  {t(STATUS_KEYS[item.status])}
                </span>
                <a
                  className="results__view"
                  href={item.pdfUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {t("res_view")}
                </a>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}