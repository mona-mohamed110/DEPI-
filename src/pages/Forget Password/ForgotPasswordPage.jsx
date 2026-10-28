import { useNavigate } from "react-router-dom";
import ForgetPassword from "./ForgetPassword";

function ForgotPasswordPage() {
  const navigate = useNavigate();
  return (
    <ForgetPassword
      onExit={() => navigate("/login")}
      onContinue={() => navigate("/login")}
    />
  );
}

export default ForgotPasswordPage;