import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from "react-router-dom";
import ClinicLabSearch from "./pages/ClinicLabSearch";
import Home from "./pages/Home";
import LearnMore from "./pages/LearnMore";
import ScrollToHash from "./components/ScrollToHash";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ForgetPassword from "./pages/Forget Password/ForgetPassword";

function ForgotPasswordPage() {
  const navigate = useNavigate();
  return (
    <ForgetPassword
      onExit={() => navigate("/login")}
      onContinue={() => navigate("/login")}
    />
  );
}

function App() {
  return (
    <Router>
      <ScrollToHash />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/learn-more" element={<LearnMore />} />
        <Route path="/ClinicLabSearch" element={<ClinicLabSearch />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;