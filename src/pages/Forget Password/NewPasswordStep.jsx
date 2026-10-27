import { useMemo, useState } from "react";
import { FaEye, FaEyeSlash, FaCheckCircle, FaRegCircle } from "react-icons/fa";
import { resetPassword } from "./api";
import BackButton from "./BackButton";
import "./style/NewPasswordStep.css";

const RULES = [
  { id: "len", label: "8 أحرف على الأقل", test: (p) => p.length >= 8 },
  { id: "upper", label: "حرف كبير واحد على الأقل (A-Z)", test: (p) => /[A-Z]/.test(p) },
  { id: "num", label: "رقم واحد على الأقل", test: (p) => /\d/.test(p) },
];

const LEVELS = ["", "ضعيفة", "متوسطة", "جيدة", "قوية"];

function PasswordInput({ id, value, onChange, placeholder, invalid, autoFocus }) {
  const [show, setShow] = useState(false);
  return (
    <div className="fp-input-wrap">
      <input
        id={id}
        type={show ? "text" : "password"}
        className={`fp-input ${invalid ? "fp-input--error" : ""}`}
        placeholder={placeholder}
        autoComplete="new-password"
        autoFocus={autoFocus}
        value={value}
        onChange={onChange}
        aria-invalid={invalid}
      />
      <button
        type="button"
        className="fp-eye"
        onClick={() => setShow((s) => !s)}
        aria-label={show ? "إخفاء كلمة المرور" : "إظهار كلمة المرور"}
      >
        {show ? <FaEyeSlash /> : <FaEye />}
      </button>
    </div>
  );
}

export default function NewPasswordStep({ email, code, onBack, onDone }) {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const results = useMemo(
    () => RULES.map((r) => ({ ...r, ok: r.test(password) })),
    [password]
  );
  const allRules = results.every((r) => r.ok);

  // القوة = عدد الشروط المحققة + نقطة لو فيه رمز خاص (من 0 إلى 4)
  const score = password
    ? results.filter((r) => r.ok).length + (/[^A-Za-z0-9]/.test(password) ? 1 : 0)
    : 0;

  const mismatch = confirm.length > 0 && confirm !== password;
  const canSubmit = allRules && confirm === password && !loading;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!canSubmit) return;
    setLoading(true);
    setError("");
    try {
      await resetPassword({ email, code, password });
      onDone();
    } catch (err) {
      setError(err.message || "تعذّر تحديث كلمة المرور. حاول مرة أخرى.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="fp-step" onSubmit={handleSubmit} noValidate>
      <BackButton onClick={onBack} />

      <h1 className="fp-title">تعيين كلمة مرور جديدة</h1>
      <p className="fp-sub">
        أنشئ كلمة مرور جديدة، وتأكد أنها تختلف عن كلمات المرور السابقة لحماية حسابك.
      </p>

      <div className="fp-field">
        <label className="fp-label" htmlFor="fp-pass">كلمة المرور</label>
        <PasswordInput
          id="fp-pass"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="أدخل كلمة المرور الجديدة"
          autoFocus
        />

        {password && (
          <div className="pw-strength" aria-live="polite">
            <div className={`pw-bars pw-level-${score}`}>
              {[1, 2, 3, 4].map((n) => (
                <span key={n} className={n <= score ? "on" : ""} />
              ))}
            </div>
            <span className={`pw-label pw-level-${score}`}>{LEVELS[score]}</span>
          </div>
        )}

        <ul className="pw-rules">
          {results.map((r) => (
            <li key={r.id} className={r.ok ? "ok" : ""}>
              {r.ok ? <FaCheckCircle /> : <FaRegCircle />} {r.label}
            </li>
          ))}
        </ul>
      </div>

      <div className="fp-field">
        <label className="fp-label" htmlFor="fp-confirm">تأكيد كلمة المرور</label>
        <PasswordInput
          id="fp-confirm"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          placeholder="أعد إدخال كلمة المرور"
          invalid={mismatch}
        />
        {mismatch && <p className="fp-error" role="alert">كلمتا المرور غير متطابقتين.</p>}
        {error && <p className="fp-error" role="alert">{error}</p>}
      </div>

      <button
        type="submit"
        className={`fp-btn ${loading ? "fp-btn--loading" : ""}`}
        disabled={!canSubmit}
      >
        {loading ? <span className="fp-spinner" aria-label="جارٍ التحديث" /> : "تحديث كلمة المرور"}
      </button>
    </form>
  );
}
