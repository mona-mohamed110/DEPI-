import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, ChevronUp, Languages, LogOut, Moon, Sun, User, SlidersHorizontal, Check } from 'lucide-react';
import { useApp } from '../../context/AppContext.jsx';

export default function SettingsMenu() {
  const { t, lang, setLang, theme, toggleTheme } = useApp();
  const [open, setOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const ref = useRef(null);
  const navigate = useNavigate();
  const Arrow = lang === 'ar' ? ChevronLeft : ChevronRight;

  // close on outside click / Escape
  useEffect(() => {
    if (!open) return undefined;
    const onDown = (e) => ref.current && !ref.current.contains(e.target) && setOpen(false);
    const onKey = (e) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const go = (path) => {
    setOpen(false);
    navigate(path);
  };

  const logout = () => {
    setOpen(false);
    // TODO: اربطها بنظام تسجيل الدخول الفعلي
    navigate('/login');
  };

  return (
    <div className="settings-wrap" ref={ref}>
      {open && (
        <div className="menu" role="menu">
          <div className="menu-title">{t('preferred_settings')}</div>

          <button className="menu-item" onClick={() => setLangOpen((v) => !v)} aria-expanded={langOpen}>
            <Languages size={18} />
            <span className="grow">{t('language')}</span>
            <span className="muted">{t('current_lang')}</span>
            <Arrow size={16} className="muted" />
          </button>
          {langOpen && (
            <div className="submenu">
              {[
                ['ar', 'العربية'],
                ['en', 'English'],
              ].map(([code, label]) => (
                <button key={code} className="menu-item sub" onClick={() => setLang(code)}>
                  <span className="grow">{label}</span>
                  {lang === code && <Check size={16} />}
                </button>
              ))}
            </div>
          )}

          <div className="menu-item static">
            {theme === 'dark' ? <Moon size={18} /> : <Sun size={18} />}
            <span className="grow">{theme === 'dark' ? t('dark_mode') : t('light_mode')}</span>
            <button
              className={`switch ${theme === 'dark' ? 'on' : ''}`}
              role="switch"
              aria-checked={theme === 'dark'}
              aria-label={t('dark_mode')}
              onClick={toggleTheme}
            />
          </div>

          <hr />
          <button className="menu-item" onClick={() => go('/patient/profile')}>
            <User size={18} />
            <span className="grow">{t('profile')}</span>
          </button>
          <button className="menu-item" onClick={() => go('/patient/account-settings')}>
            <SlidersHorizontal size={18} />
            <span className="grow">{t('account_settings')}</span>
          </button>
          <hr />
          <button className="menu-item danger" onClick={logout}>
            <LogOut size={18} />
            <span className="grow">{t('logout')}</span>
          </button>
        </div>
      )}

      <button className={`settings-btn ${open ? 'open' : ''}`} onClick={() => setOpen((v) => !v)} aria-haspopup="menu" aria-expanded={open}>
        <SlidersHorizontal size={18} />
        <span className="grow">{t('account_and_settings')}</span>
        <ChevronUp size={16} className="chev" />
      </button>
    </div>
  );
}
