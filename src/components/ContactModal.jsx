import { useEffect } from "react";
import "./Style/ContactModal.css";

export default function ContactModal({ isOpen, onClose }) {
  useEffect(
    function () {
      function handleKey(e) {
        if (e.key === "Escape") {
          onClose();
        }
      }
      if (isOpen) {
        document.addEventListener("keydown", handleKey);
        document.body.style.overflow = "hidden";
      }
      return function () {
        document.removeEventListener("keydown", handleKey);
        document.body.style.overflow = "";
      };
    },
    [isOpen, onClose]
  );

  function handleSubmit(e) {
    e.preventDefault();
  }

  return (
    <div
      className={isOpen ? "cm-overlay is-open" : "cm-overlay"}
      onClick={onClose}
      aria-hidden={!isOpen}
    >
      <div
        className="cm-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="cm-title"
        onClick={function (e) {
          e.stopPropagation();
        }}
      >
        <button type="button" className="cm-close" onClick={onClose} aria-label="إغلاق">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M2 2l10 10M12 2L2 12" />
          </svg>
        </button>

        <h2 className="cm-title" id="cm-title">تواصل معنا</h2>
        <p className="cm-subtitle">يسعدنا استقبال استفساراتك</p>

        <form onSubmit={handleSubmit}>
          <div className="cm-grid">
            <div className="cm-field">
              <label htmlFor="cm-name">الاسم بالكامل</label>
              <input id="cm-name" type="text" required />
            </div>
            <div className="cm-field">
              <label htmlFor="cm-email">البريد الإلكتروني</label>
              <input id="cm-email" type="email" required />
            </div>
            <div className="cm-field cm-full">
              <label htmlFor="cm-subject">موضوع الرسالة</label>
              <input id="cm-subject" type="text" required />
            </div>
            <div className="cm-field cm-full">
              <label htmlFor="cm-message">رسالتك</label>
              <textarea id="cm-message" placeholder="اكتبي رسالتك هنا..." required />
            </div>
          </div>
          <button type="submit" className="cm-submit">إرسال الرسالة</button>
        </form>
      </div>
    </div>
  );
}