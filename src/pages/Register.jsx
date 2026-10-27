import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FaMicroscope, FaUserMd, FaUsers } from "react-icons/fa";
import AuthLayout from "./AuthLayout";
import Field from "./Field";
import { register } from "./authApi";
import "../components/Style/Register.css";

const ROLES = [
  { id: "lab", title: "مختبر", sub: "حساب مختبر", icon: <FaMicroscope /> },
  { id: "doctor", title: "طبيب", sub: "حساب طبيب", icon: <FaUserMd /> },
  { id: "patient", title: "مريض", sub: "حساب مريض", icon: <FaUsers /> },
];

// الخانة الأخيرة في العمود الشمال بتتغير حسب نوع الحساب
const EXTRA_FIELD = {
  lab: "اسم المختبر",
  doctor: "التخصص",
  patient: "المدينة",
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const PHONE_RE = /^\+?\d{10,15}$/;
const PASS_OK = (p) => p.length >= 8 && /[A-Z]/.test(p) && /\d/.test(p);

const EMPTY = { fullName: "", email: "", phone: "", password: "", confirm: "", extra: "" };

function validate(f, role) {
  const e = {};
  if (f.fullName.trim().length < 3) e.fullName = "الاسم الكامل مطلوب (3 أحرف على الأقل)";
  if (!EMAIL_RE.test(f.email.trim())) e.email = "بريد إلكتروني غير صحيح";
  if (!PHONE_RE.test(f.phone.replace(/[\s-]/g, ""))) e.phone = "رقم هاتف غير صحيح";
  if (!PASS_OK(f.password)) e.password = "8 أحرف على الأقل مع حرف كبير ورقم";
  if (f.confirm !== f.password || !f.confirm) e.confirm = "كلمتا المرور غير متطابقتين";
  if (!f.extra.trim()) e.extra = `${EXTRA_FIELD[role]} مطلوب`;
  return e;
}

export default function Register() {
  const navigate = useNavigate();
  const [role, setRole] = useState("doctor");
  const [form, setForm] = useState(EMPTY);
  const [touched, setTouched] = useState({});
  const [terms, setTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const errors = validate(form, role);
  const canSubmit = Object.keys(errors).length === 0 && terms && !loading;

  const handleChange = (e) => {
    setError("");
    setForm({ ...form, [e.target.name]: e.target.value });
  };
  const handleBlur = (e) => setTouched({ ...touched, [e.target.name]: true });
  const errOf = (name) => (touched[name] ? errors[name] : "");

  const changeRole = (id) => {
    setRole(id);
    setForm({ ...form, extra: "" });
    setTouched({ ...touched, extra: false });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!canSubmit) return;
    setLoading(true);
    setError("");
    try {
      // eslint-disable-next-line no-unused-vars
      const { confirm, ...data } = form;
      await register({ role, ...data });
      navigate("/login", { state: { registered: true } });
    } catch (err) {
      setError(err.message || "حدث خطأ، حاول مرة أخرى.");
    } finally {
      setLoading(false);
    }
  };

  const common = (name) => ({
    name,
    value: form[name],
    onChange: handleChange,
    onBlur: handleBlur,
    error: errOf(name),
  });

  return (
    <AuthLayout wide>
      <form onSubmit={handleSubmit} noValidate>
        <h1 className="auth-title">إنشاء حساب جديد</h1>
        <p className="auth-tagline reg-tagline">ابدأ رحلة رعاية صحية ذكية ومتكاملة</p>

        {/* اختيار نوع الحساب */}
        <div className="reg-roles" role="radiogroup" aria-label="نوع الحساب">
          {ROLES.map((r) => (
            <button
              key={r.id}
              type="button"
              role="radio"
              aria-checked={role === r.id}
              className={`reg-role${role === r.id ? " reg-role--active" : ""}`}
              onClick={() => changeRole(r.id)}
            >
              <span className="reg-role-icon">{r.icon}</span>
              <strong>{r.title}</strong>
              <small>{r.sub}</small>
            </button>
          ))}
        </div>

        {error && (
          <p className="auth-banner auth-banner--error" role="alert">
            {error}
          </p>
        )}

        <div className="reg-grid">
          <Field id="reg-email" label="البريد الإلكتروني" type="email" placeholder="البريد الإلكتروني" autoComplete="email" {...common("email")} />
          <Field id="reg-name" label="الاسم الكامل" placeholder="الاسم الكامل" autoComplete="name" {...common("fullName")} />
          <Field id="reg-pass" label="كلمة المرور" type="password" placeholder="كلمة المرور" autoComplete="new-password" {...common("password")} />
          <Field id="reg-phone" label="رقم الهاتف" type="tel" placeholder="رقم الهاتف" autoComplete="tel" {...common("phone")} />
          <Field id="reg-confirm" label="تأكيد كلمة المرور" type="password" placeholder="تأكيد كلمة المرور" autoComplete="new-password" {...common("confirm")} />
          <Field id="reg-extra" label={EXTRA_FIELD[role]} placeholder={EXTRA_FIELD[role]} {...common("extra")} />
        </div>

        <label className="reg-terms">
          <input type="checkbox" checked={terms} onChange={(e) => setTerms(e.target.checked)} />
          <span>
            أوافق على{" "}
            <Link to="/terms" className="auth-link">
              الشروط والأحكام
            </Link>
          </span>
        </label>

        <button
          type="submit"
          className={`auth-btn${loading ? " auth-btn--loading" : ""}`}
          disabled={!canSubmit}
        >
          {loading ? <span className="auth-spinner" aria-label="جارٍ التسجيل" /> : "تسجيل"}
        </button>

        <p className="auth-switch">
          لديك حساب بالفعل؟{" "}
          <Link to="/login" className="auth-link">
            تسجيل الدخول
          </Link>
        </p>
      </form>
    </AuthLayout>
  );
}
