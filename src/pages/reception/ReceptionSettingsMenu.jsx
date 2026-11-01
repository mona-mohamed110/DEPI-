import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, ChevronUp, Languages, LogOut, Sun, Moon, SlidersHorizontal, Check, User } from 'lucide-react';

export default function ReceptionSettingsMenu() {
  const [open, setOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  
  const [lang, setLang] = useState(() => {
    return localStorage.getItem('reception_lang') || 'ar';
  });

  const [isDark, setIsDark] = useState(() => {
    return localStorage.getItem('reception_theme') === 'dark';
  });
  
  const ref = useRef(null);
  const navigate = useNavigate();
  const Arrow = lang === 'ar' ? ChevronLeft : ChevronRight;

  useEffect(() => {
    if (isDark) {
      localStorage.setItem('reception_theme', 'dark');
    } else {
      localStorage.setItem('reception_theme', 'light');
    }
  }, [isDark]);

  const handleLangChange = (code) => {
    setLang(code);
    localStorage.setItem('reception_lang', code);
    setLangOpen(false);
    window.dispatchEvent(new Event('storage'));
  };

  const toggleTheme = () => {
    setIsDark(prev => !prev);
  };

  const logout = () => {
    setOpen(false);
    navigate('/login');
  };

  const t = {
    ar: { title: 'الإعدادات المفضلة', lang: 'اللغة', profile: 'الملف الشخصي', logout: 'تسجيل الخروج', light: 'الوضع الفاتح', dark: 'الوضع الليلي', acc: 'حساب الاستقبال' },
    en: { title: 'Preferences', lang: 'Language', profile: 'Profile', logout: 'Log Out', light: 'Light Mode', dark: 'Dark Mode', acc: 'Reception Account' }
  }[lang];

  return (
    <div className="settings-wrap" ref={ref}>
      {open && (
        <div className="menu" role="menu">
          <div className="menu-title">{t.title}</div>

          <button className="menu-item" onClick={() => setLangOpen((v) => !v)} aria-expanded={langOpen}>
            <Languages size={18} />
            <span className="grow">{t.lang}</span>
            <span className="muted">{lang === 'ar' ? 'العربية' : 'English'}</span>
            <Arrow size={16} className="muted" />
          </button>
          {langOpen && (
            <div className="submenu">
              {[
                ['ar', 'العربية'],
                ['en', 'English'],
              ].map(([code, label]) => (
                <button key={code} className="menu-item sub" onClick={() => handleLangChange(code)}>
                  <span className="grow">{label}</span>
                  {lang === code && <Check size={16} />}
                </button>
              ))}
            </div>
          )}

          <div className="menu-item static">
            {isDark ? <Moon size={18} /> : <Sun size={18} />}
            <span className="grow">{isDark ? t.dark : t.light}</span>
            <button
              className={`switch ${isDark ? 'on' : ''}`}
              role="switch"
              aria-checked={isDark}
              onClick={toggleTheme}
            />
          </div>

          <hr />

          <button 
            className="menu-item" 
            onClick={() => {
              setOpen(false);
              navigate('/reception/profile');
            }}
          >
            <User size={18} />
            <span className="grow">{t.profile}</span>
          </button>

          <hr />
          
          <button className="menu-item danger" onClick={logout}>
            <LogOut size={18} />
            <span className="grow">{t.logout}</span>
          </button>
        </div>
      )}

      <button className={`settings-btn ${open ? 'open' : ''}`} onClick={() => setOpen((v) => !v)} aria-haspopup="menu" aria-expanded={open}>
        <SlidersHorizontal size={18} />
        <span className="grow">{t.acc}</span>
        <ChevronUp size={16} className="chev" />
      </button>
    </div>
  );
}