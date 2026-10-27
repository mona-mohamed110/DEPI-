import { useState } from "react";
import EmailStep from "./EmailStep";
import OtpStep from "./OtpStep";
import NewPasswordStep from "./NewPasswordStep";
import SuccessStep from "./SuccessStep";
import "./style/ForgetPassword.css";

/**
 * onExit     → الرجوع لصفحة تسجيل الدخول (زرار الرجوع في أول خطوة)
 * onContinue → بعد نجاح تغيير الباسورد (زرار متابعة)
 */
export default function ForgetPassword({
  onExit = () => {},
  onContinue = () => {},
}) {
  const [step, setStep] = useState("email"); // email | otp | password | success
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");

  return (
    <div className="fp-page" dir="rtl">
      <div className="fp-card">
        {step === "email" && (
          <EmailStep
            initialEmail={email}
            onBack={onExit}
            onNext={(value) => {
              setEmail(value);
              setStep("otp");
            }}
          />
        )}

        {step === "otp" && (
          <OtpStep
            email={email}
            onBack={() => setStep("email")}
            onVerified={(value) => {
              setCode(value);
              setStep("password");
            }}
          />
        )}

        {step === "password" && (
          <NewPasswordStep
            email={email}
            code={code}
            onBack={() => setStep("otp")}
            onDone={() => setStep("success")}
          />
        )}

        {step === "success" && (
          <SuccessStep onBack={onExit} onContinue={onContinue} />
        )}
      </div>
    </div>
  );
}
