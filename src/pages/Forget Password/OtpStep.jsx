import { useEffect, useRef, useState } from "react";
import { sendCode, verifyCode } from "./api";
import BackButton from "./BackButton";
import "./style/OtpStep.css";

const LENGTH = 6;
const RESEND_SECONDS = 60;

// ah•••••@gmail.com
function maskEmail(email) {
  const [name = "", domain = ""] = email.split("@");
  return `${name.slice(0, 2)}•••••@${domain}`;
}

const formatTime = (s) => `0:${String(s).padStart(2, "0")}`;

export default function OtpStep({ email, onBack, onVerified }) {
  const [digits, setDigits] = useState(Array(LENGTH).fill(""));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [seconds, setSeconds] = useState(RESEND_SECONDS);
  const inputs = useRef([]);

  const code = digits.join("");
  const complete = code.length === LENGTH;

  useEffect(() => {
    inputs.current[0]?.focus();
  }, []);

  useEffect(() => {
    if (seconds <= 0) return;
    const t = setTimeout(() => setSeconds((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [seconds]);

  const focusAt = (i) => inputs.current[Math.max(0, Math.min(LENGTH - 1, i))]?.focus();

  const handleChange = (i, value) => {
    const digit = value.replace(/\D/g, "").slice(-1);
    setError("");
    setDigits((prev) => {
      const next = [...prev];
      next[i] = digit;
      return next;
    });
    if (digit) focusAt(i + 1);
  };

  const handleKeyDown = (i, e) => {
    if (e.key === "Backspace" && !digits[i]) {
      focusAt(i - 1);
    } else if (e.key === "ArrowLeft") {
      focusAt(i - 1);
    } else if (e.key === "ArrowRight") {
      focusAt(i + 1);
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, LENGTH);
    if (!pasted) return;
    setError("");
    setDigits(Array.from({ length: LENGTH }, (_, i) => pasted[i] || ""));
    focusAt(pasted.length >= LENGTH ? LENGTH - 1 : pasted.length);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!complete || loading) return;
    setLoading(true);
    setError("");
    try {
      await verifyCode(email, code);
      onVerified(code);
    } catch (err) {
      setError(err.message || "الرمز غير صحيح. حاول مرة أخرى.");
      setDigits(Array(LENGTH).fill(""));
      focusAt(0);
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (seconds > 0) return;
    setError("");
    setNotice("");
    try {
      await sendCode(email);
      setDigits(Array(LENGTH).fill(""));
      setSeconds(RESEND_SECONDS);
      setNotice("تم إرسال رمز جديد إلى بريدك الإلكتروني.");
      focusAt(0);
    } catch (err) {
      setError(err.message || "تعذّرت إعادة إرسال الرمز. حاول مرة أخرى.");
    }
  };

  return (
    <form className="fp-step" onSubmit={handleSubmit}>
      <BackButton onClick={onBack} />

      <h1 className="fp-title">إدخال رمز التحقق</h1>
      <p className="fp-sub">
        يرجى إدخال الرمز المكوّن من 6 أرقام المرسل إلى بريدك الإلكتروني{" "}
        {/* bdi + ltr علشان الإيميل يتعرض صح وسط النص العربي */}
        <strong>
          <bdi dir="ltr">{maskEmail(email)}</bdi>
        </strong>
      </p>

      <div className="otp-boxes" onPaste={handlePaste} role="group" aria-label="رمز التحقق">
        {digits.map((d, i) => (
          <input
            key={i}
            ref={(el) => (inputs.current[i] = el)}
            className={`otp-box ${error ? "otp-box--error" : ""}`}
            type="text"
            inputMode="numeric"
            autoComplete={i === 0 ? "one-time-code" : "off"}
            maxLength={1}
            value={d}
            onChange={(e) => handleChange(i, e.target.value)}
            onKeyDown={(e) => handleKeyDown(i, e)}
            onFocus={(e) => e.target.select()}
            aria-label={`الرقم ${i + 1}`}
          />
        ))}
      </div>

      {error && <p className="fp-error otp-msg" role="alert">{error}</p>}
      {notice && !error && <p className="otp-msg otp-notice" role="status">{notice}</p>}

      <button
        type="submit"
        className={`fp-btn ${loading ? "fp-btn--loading" : ""}`}
        disabled={!complete || loading}
      >
        {loading ? <span className="fp-spinner" aria-label="جارٍ التحقق" /> : "تأكيد الرمز"}
      </button>

      <p className="otp-resend">
        لم يصلك الرمز؟{" "}
        {seconds > 0 ? (
          <span className="otp-timer">
            إعادة الإرسال بعد <bdi dir="ltr">{formatTime(seconds)}</bdi>
          </span>
        ) : (
          <button type="button" className="otp-resend-btn" onClick={handleResend}>
            إعادة إرسال الرمز
          </button>
        )}
      </p>
    </form>
  );
}
