import { useState } from "react";
import "./Style/Nav.css";
import logo from "../assets/Smart-Healthcare-Ledger-Logo.png";
import { Link } from "react-router-dom";

function Navbar() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <nav className="navbar">
      <div className="nav-brand">
        <img className="logo" src={logo} alt="الشعار" />
      </div>

      <button
        className="menu-toggle"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="القائمة"
      >
        <span className={`hamburger ${isOpen ? "open" : ""}`}></span>
      </button>

      <div className={`nav-content ${isOpen ? "active" : ""}`}>
        <ul className="nav-links">
          <li><Link to="/" onClick={() => setIsOpen(false)}>الرئيسية</Link></li> 
          <li><a href="#services" onClick={() => setIsOpen(false)}>خدماتنا</a></li>
          <li><a href="#how-it-works" onClick={() => setIsOpen(false)}>كيف نعمل</a></li>
          <li><a href="#about" onClick={() => setIsOpen(false)}>من نحن</a></li>
        </ul>

        <div className="nav-actions">
          <button className="btn btn-primary">دخول</button>
          <button className="btn btn-ghost">تسجيل جديد</button>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;