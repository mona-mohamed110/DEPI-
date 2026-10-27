// import Logo from "./Logo";
import ShieldIllustration from "./ShieldIllustration";
import "../components/style/AuthLayout.css";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

export default function AuthLayout({ children, wide = false }) {
  return (
    <div className="auth-page" dir="rtl">
      {/* <div className="auth-logo">
        <Logo />
      </div> */}
     <Navbar/>


      <main className="auth-main">
        <section className={`auth-form-col${wide ? " auth-form-col--wide" : ""}`}>
          {children}
        </section>
        <div className="auth-illustration" aria-hidden="true">
          <ShieldIllustration />
        </div>
      </main>

      <Footer/>
    </div>
  );
}
