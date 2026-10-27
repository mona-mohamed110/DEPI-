import { useState } from "react";
import { sendCode } from "./api";
import BackButton from "./BackButton";
import "./style/EmailStep.css";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export default function EmailStep({ initialEmail = "", onBack, onNext }) {
  const [email, setEmail] = useState(initialEmail);
  const [touched, setTouched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const valid = EMAIL_RE.test(email.trim());
  const showFormatError = touched && email && !valid;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!valid || loading) return;
    setLoading(true);
    setError("");
    try {
      await sendCode(email.trim());
      onNext(email.trim());
    } catch (err) {
      setError(err.message || "حدث خطأ ما. حاول مرة أخرى.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="fp-step" onSubmit={handleSubmit} noValidate>
      <BackButton onClick={onBack} />

      <h1 className="fp-title">نسيت كلمة المرور</h1>
      <p className="fp-sub">
        أدخل البريد الإلكتروني المرتبط بحسابك وسنرسل لك رمز التحقق.
      </p>

      <div className="fp-field">
        <label className="fp-label" htmlFor="fp-email">البريد الإلكتروني</label>
        <input
          id="fp-email"
          type="email"
          className={`fp-input ${showFormatError ? "fp-input--error" : ""}`}
          placeholder="أدخل بريدك الإلكتروني"
          autoComplete="email"
          autoFocus
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onBlur={() => setTouched(true)}
          aria-invalid={showFormatError}
          aria-describedby="fp-email-msg"
        />
        <p
          id="fp-email-msg"
          className={showFormatError || error ? "fp-error" : "fp-info"}
          role={showFormatError || error ? "alert" : undefined}
        >
          {showFormatError
            ? "يرجى إدخال بريد إلكتروني صحيح."
            : error ||
              "إذا كان هذا البريد مسجلاً لدينا، سيصلك رمز التحقق قريباً."}
        </p>
      </div>

      <button
        type="submit"
        className={`fp-btn ${loading ? "fp-btn--loading" : ""}`}
        disabled={!valid || loading}
      >
        {loading ? <span className="fp-spinner" aria-label="جارٍ الإرسال" /> : "إعادة تعيين كلمة المرور"}
      </button>
    </form>
  );
}
