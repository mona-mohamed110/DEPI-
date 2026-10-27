import { FaCheck } from "react-icons/fa";
import BackButton from "./BackButton";
import "./style/SuccessStep.css";

export default function SuccessStep({ onBack, onContinue }) {
  return (
    <div className="fp-step">
      <BackButton onClick={onBack} />

      <div className="success-icon" aria-hidden="true">
        <FaCheck />
      </div>

      <h1 className="fp-title success-title">تم بنجاح</h1>
      <p className="fp-sub success-sub">
        تهانينا! تم تحديث كلمة المرور بنجاح. اضغط متابعة لتسجيل الدخول.
      </p>

      <button type="button" className="fp-btn" onClick={onContinue} autoFocus>
        متابعة
      </button>
    </div>
  );
}
