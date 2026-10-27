import { useState } from "react";
import { FaEye, FaEyeSlash } from "react-icons/fa";

/**
 * حقل إدخال موحّد. لو type="password" بيظهر زرار إظهار/إخفاء تلقائيًا.
 * label بيتستخدم كـ aria-label (التصميم مفيهوش labels ظاهرة).
 */
export default function Field({ id, label, type = "text", error, ...props }) {
  const [show, setShow] = useState(false);
  const isPassword = type === "password";

  return (
    <div className="auth-field">
      <div className="auth-input-wrap">
        <input
          id={id}
          aria-label={label}
          type={isPassword && show ? "text" : type}
          className={`auth-input${isPassword ? " auth-input--pw" : ""}${error ? " auth-input--error" : ""}`}
          aria-invalid={!!error}
          aria-describedby={error ? `${id}-err` : undefined}
          {...props}
        />
        {isPassword && (
          <button
            type="button"
            className="auth-eye"
            onClick={() => setShow((s) => !s)}
            aria-label={show ? "إخفاء كلمة المرور" : "إظهار كلمة المرور"}
          >
            {show ? <FaEye /> : <FaEyeSlash />}
          </button>
        )}
      </div>
      {error && (
        <p id={`${id}-err`} className="auth-error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
