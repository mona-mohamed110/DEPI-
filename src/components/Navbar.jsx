import { useState } from "react";
import "./Style/Nav.css";
import logo from "../assets/logo.png";
import { Link } from "react-router-dom";

function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const close = () => setIsOpen(false);

  return (
    <nav className="navbar">
      <div className="nav-brand">
        <Link to="/" onClick={close}>
          <img className="logo" src={logo} alt="الشعار" />
        </Link>
      </div>

      <button
        className="menu-toggle"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="القائمة"
        aria-expanded={isOpen}
      >
        <span className={`hamburger ${isOpen ? "open" : ""}`}></span>
      </button>

      <div className={`nav-content ${isOpen ? "active" : ""}`}>
        <ul className="nav-links">
          <li><Link to="/" onClick={close}>الرئيسية</Link></li>
          <li><Link to="/#services" onClick={close}>خدماتنا</Link></li>
          <li><Link to="/#how-it-works" onClick={close}>كيف نعمل</Link></li>
          <li><Link to="/#about" onClick={close}>من نحن</Link></li>
        </ul>

        <div className="nav-actions">
          <Link to="/login" className="btn btn-primary" onClick={close}>دخول</Link>
          <Link to="/register" className="btn btn-ghost" onClick={close}>تسجيل جديد</Link>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;