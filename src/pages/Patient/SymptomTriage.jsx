import { useState } from "react";
import { Link } from "react-router-dom";
import { useApp } from "../../context/AppContext.jsx";
import "../../components/Style/Patient/SymptomTriage.css";

const CHIPS = [
  "sym_chip_headache",
  "sym_chip_fever",
  "sym_chip_chest",
  "sym_chip_cough",
];

const DOCTORS = [
  { id: 1, nameKey: "sym_doc_1_name", initKey: "sym_doc_1_init", metaKey: "sym_doc_1_meta" },
  { id: 2, nameKey: "sym_doc_2_name", initKey: "sym_doc_2_init", metaKey: "sym_doc_2_meta" },
];

export default function SymptomTriage() {
  const { t, theme, lang, toast } = useApp();
  const [text, setText] = useState("");
  const [analyzed, setAnalyzed] = useState(false);

  const handleChange = (event) => {
    setText(event.target.value);
  };

  const handleChipClick = (event) => {
    const symptom = event.currentTarget.dataset.symptom;
    const separator = lang === "ar" ? "، " : ", ";
    setText((prev) => (prev.trim() ? `${prev.trim()}${separator}${symptom}` : symptom));
  };

  const handleAnalyze = () => {
    if (!text.trim()) {
      toast(t("sym_empty"));
      return;
    }
    setAnalyzed(true);
  };

  return (
    <section className={`triage triage--${theme}`}>
      <header className="triage__header">
        <h1 className="triage__title">{t("sym_title")}</h1>
        <p className="triage__subtitle">{t("sym_sub")}</p>
      </header>

      <div className="triage__warning" role="note">
        <span aria-hidden="true">⚠️</span>
        <span>{t("sym_warning")}</span>
      </div>

      <div className="triage__card">
        <textarea
          className="triage__textarea"
          value={text}
          onChange={handleChange}
          placeholder={t("sym_placeholder")}
        />

        <div className="triage__chips">
          {CHIPS.map((key) => (
            <button
              type="button"
              className="triage__chip"
              key={key}
              data-symptom={t(key)}
              onClick={handleChipClick}
            >
              {t(key)}
            </button>
          ))}
        </div>

        <button type="button" className="triage__primary" onClick={handleAnalyze}>
          {t("sym_analyze")}
        </button>
      </div>

      {analyzed && (
        <div className="triage__card triage__card--result">
          <h2 className="triage__heading">{t("sym_result_title")}</h2>

          <div className="triage__result">
            <span className="triage__result-icon" aria-hidden="true">
              🧠
            </span>
            <div className="triage__result-text">
              <p className="triage__result-title">{t("sym_likely")}</p>
              <p className="triage__result-meta">{t("sym_severity")}</p>
            </div>
            <span className="triage__badge">{t("sym_medium")}</span>
          </div>

          <h2 className="triage__heading triage__heading--doctors">
            {t("sym_doctors_title")}
          </h2>

          <ul className="triage__doctors">
            {DOCTORS.map((doc) => (
              <li className="triage__doctor" key={doc.id}>
                <span className="triage__avatar" aria-hidden="true">
                  {t(doc.initKey)}
                </span>
                <div className="triage__doctor-text">
                  <p className="triage__doctor-name">{t(doc.nameKey)}</p>
                  <p className="triage__doctor-meta">{t(doc.metaKey)}</p>
                </div>
              </li>
            ))}
          </ul>

          <Link className="triage__primary triage__primary--link" to="/patient/booking">
            {t("sym_book")}
          </Link>
        </div>
      )}
    </section>
  );
}