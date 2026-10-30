import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Check, ChevronLeft, ChevronRight, ChevronUp, Languages, LogOut, Moon, SlidersHorizontal, Sun, User } from "lucide-react";
import { useApp } from "../../context/AppContext.jsx";

export default function AdminSettingsMenu({ admin }) {
  const { t, lang, setLang, theme, toggleTheme } = useApp();
  const [open, setOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const ref = useRef(null);
  const navigate = useNavigate();
  const Arrow = lang === "ar" ? ChevronLeft : ChevronRight;

  useEffect(function () {
    if (!open) {
      return undefined;
    }
    function onDown(e) {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false);
      }
    }
    function onKey(e) {
      if (e.key === "Escape") {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return function () {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  function go(path) {
    setOpen(false);
    navigate(path);
  }

  function logout() {
    setOpen(false);
    navigate("/login");
  }

  return (
    <div className="admin-settings" ref={ref}>
      {open && (
        <div className="admin-menu">
          <div className="admin-menu-title">{t("preferred_settings")}</div>

          <button className="admin-menu-item" onClick={() => setLangOpen(!langOpen)}>
            <Languages size={18} />
            <span className="grow">{t("language")}</span>
            <span className="muted">{t("current_lang")}</span>
            <Arrow size={16} className="muted" />
          </button>

          {langOpen && (
            <div className="admin-submenu">
              <button className="admin-menu-item" onClick={() => setLang("ar")}>
                <span className="grow">العربية</span>
                {lang === "ar" && <Check size={16} />}
              </button>
              <button className="admin-menu-item" onClick={() => setLang("en")}>
                <span className="grow">English</span>
                {lang === "en" && <Check size={16} />}
              </button>
            </div>
          )}

          <div className="admin-menu-item static">
            {theme === "dark" ? <Moon size={18} /> : <Sun size={18} />}
            <span className="grow">{theme === "dark" ? t("dark_mode") : t("light_mode")}</span>
            <button
              className={theme === "dark" ? "admin-switch on" : "admin-switch"}
              onClick={toggleTheme}
            ></button>
          </div>

          <hr />
          <button className="admin-menu-item" onClick={() => go("/admin/profile")}>
            <User size={18} />
            <span className="grow">{t("profile")}</span>
          </button>
          <hr />
          <button className="admin-menu-item danger" onClick={logout}>
            <LogOut size={18} />
            <span className="grow">{t("logout")}</span>
          </button>
        </div>
      )}

      <button className="admin-user" onClick={() => setOpen(!open)}>
  <SlidersHorizontal size={18} />
  <span className="admin-user-text">{t("account_and_settings")}</span>
  <ChevronUp size={16} />
</button>
    </div>
  );
}