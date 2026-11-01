import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useLab } from "../../context/LabContext";
import Icon from "./Icon";

export default function LabSettingsMenu() {
  const { t, lang, setLang, theme, setTheme } = useLab();
  const [open, setOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const ref = useRef(null);
  const { pathname } = useLocation();
  const nav = useNavigate();
  const dark = theme === "dark";

  useEffect(() => { setOpen(false); setLangOpen(false); }, [pathname]);
  useEffect(() => {
    const off = (e) => { if (ref.current && !ref.current.contains(e.target)) { setOpen(false); setLangOpen(false); } };
    document.addEventListener("mousedown", off);
    return () => document.removeEventListener("mousedown", off);
  }, []);

  const logout = () => {
    localStorage.removeItem("token");
    nav("/login");
  };

  return (
    <div ref={ref} className="lb-set">
      {open && (
        <div className="lb-menu">
          <div className="lb-menu-h">{t("prefs")}</div>

          {/* اللغة: بتتفتح جوه نفس القائمة */}
          <button type="button" className={`lb-mi ${langOpen ? "active" : ""}`} aria-expanded={langOpen} onClick={() => setLangOpen((o) => !o)}>
            <Icon name="languages" size={18} /><span>{t("language")}</span>
            <em>{t("langName")}</em>
            <span className={`lb-lchev ${langOpen ? "open" : ""}`}><Icon name={lang === "ar" ? "chevL" : "chevR"} size={16} /></span>
          </button>
          {langOpen && (
            <div className="lb-langs">
              {[["ar", "العربية"], ["en", "English"]].map(([v, label]) => (
                <button type="button" key={v} className={`lb-lang ${lang === v ? "on" : ""}`} onClick={() => setLang(v)}>
                  <span>{label}</span>
                  {lang === v && <Icon name="check" size={16} />}
                </button>
              ))}
            </div>
          )}

          <div className="lb-mi" role="button" tabIndex={0} onClick={() => setTheme(dark ? "light" : "dark")}
            onKeyDown={(e) => e.key === "Enter" && setTheme(dark ? "light" : "dark")}>
            <Icon name={dark ? "sun" : "moon"} size={18} /><span>{dark ? t("lightMode") : t("darkMode")}</span>
            <i className={`lb-sw ${dark ? "on" : ""}`} />
          </div>
          <hr className="lb-hr" />
          <Link to="/lab/settings/profile" className="lb-mi"><Icon name="building" size={18} /><span>{t("labFile")}</span></Link>
          <hr className="lb-hr" />
          <Link to="/lab/settings/personal" className="lb-mi"><Icon name="user" size={18} /><span>{t("profile")}</span></Link>
          <Link to="/lab/settings/account" className="lb-mi"><Icon name="sliders" size={18} /><span>{t("accountSettings")}</span></Link>
          <hr className="lb-hr" />
          <button type="button" className="lb-mi danger" onClick={logout}><Icon name="logout" size={18} /><span>{t("logout")}</span></button>
        </div>
      )}
      <button type="button" className="lb-set-btn" aria-expanded={open} onClick={() => setOpen((o) => !o)}>
        <Icon name="sliders" size={20} />
        <span>{t("settingsBtn")}</span>
        <span className="lb-chev"><Icon name={open ? "chevD" : "chevU"} size={16} /></span>
      </button>
    </div>
  );
}
