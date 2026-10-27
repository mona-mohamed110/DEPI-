import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import AuthLayout from "./AuthLayout";
import Field from "./Field";
import { login } from "./authApi";
import "../components/Style/Login.css";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export default function Login({ onSuccess }) {
  const navigate = useNavigate();
  const location = useLocation();
  const justRegistered = location.state?.registered;

  const [form, setForm] = useState({ email: "", password: "" });
  const [emailTouched, setEmailTouched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const emailValid = EMAIL_RE.test(form.email.trim());
  const canSubmit = emailValid && form.password.length > 0 && !loading;

  const handleChange = (e) => {
    setError("");
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!canSubmit) return;
    setLoading(true);
    setError("");
    try {
      await login({ email: form.email.trim(), password: form.password });
      // غيّر المسار حسب صفحتك الرئيسية، أو مرّر onSuccess
      onSuccess ? onSuccess() : navigate("/");
    } catch (err) {
      setError(err.message || "حدث خطأ، حاول مرة أخرى.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout>
      <form onSubmit={handleSubmit} noValidate>
        <h1 className="auth-title">تسجيل الدخول</h1>
        <p className="auth-sub">أدخل بياناتك للوصول إلى حسابك</p>
        <p className="auth-tagline">خطوة واحدة نحو رعاية أفضل</p>

        {justRegistered && (
          <p className="auth-banner" role="status">
            تم إنشاء حسابك بنجاح، سجّل دخولك الآن.
          </p>
        )}
        {error && (
          <p className="auth-banner auth-banner--error" role="alert">
            {error}
          </p>
        )}

        <Field
          id="login-email"
          label="البريد الإلكتروني"
          type="email"
          name="email"
          placeholder="البريد الإلكتروني"
          autoComplete="email"
          autoFocus
          value={form.email}
          onChange={handleChange}
          onBlur={() => setEmailTouched(true)}
          error={emailTouched && form.email && !emailValid ? "بريد إلكتروني غير صحيح" : ""}
        />

        <Field
          id="login-password"
          label="كلمة المرور"
          type="password"
          name="password"
          placeholder="كلمة المرور"
          autoComplete="current-password"
          value={form.password}
          onChange={handleChange}
        />

        <Link to="/forgot-password" className="auth-link login-forgot">
          نسيت كلمة المرور؟
        </Link>

        <button
          type="submit"
          className={`auth-btn${loading ? " auth-btn--loading" : ""}`}
          disabled={!canSubmit}
        >
          {loading ? <span className="auth-spinner" aria-label="جارٍ الدخول" /> : "دخول"}
        </button>

        <p className="auth-switch">
          ليس لديك حساب؟{" "}
          <Link to="/register" className="auth-link">
            أنشئ حساباً جديداً
          </Link>
        </p>
      </form>
    </AuthLayout>
  );
}
