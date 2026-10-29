import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Check, ChevronLeft, ChevronRight, ChevronUp, Languages, LogOut, Moon, Sun,
  User, SlidersHorizontal, Contact, CalendarClock, UsersRound,
} from 'lucide-react';
import { useDoctor } from '../../context/DoctorContext.jsx';
import Switch from './Switch.jsx';

export default function DoctorSettingsMenu() {
  const { t, lang, setLang, theme, toggleTheme } = useDoctor();
  const [open, setOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const ref = useRef(null);
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const Arrow = lang === 'ar' ? ChevronLeft : ChevronRight;

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

  // عناصر القائمة التي تفتح صفحات
  const links = [
    { to: '/doctor/professional-profile', key: 'prof_profile', icon: Contact },
    { to: '/doctor/schedule', key: 'schedule', icon: CalendarClock },
    { to: '/doctor/team', key: 'nav_team', icon: UsersRound },
    { to: '/doctor/profile', key: 'profile', icon: User },
    { to: '/doctor/account-settings', key: 'account_settings', icon: SlidersHorizontal },
  ];

  return (
    <div className="d-settings-wrap" ref={ref}>
      {open && (
        <div className="d-menu" role="menu">
          <div className="d-menu-title">{t('preferred_settings')}</div>

          <button className="d-menu-item" onClick={() => setLangOpen((v) => !v)} aria-expanded={langOpen}>
            <Languages size={18} />
            <span className="grow">{t('language')}</span>
            <span className="muted">{t('current_lang')}</span>
            <Arrow size={16} className="muted" />
          </button>
          {langOpen && (
            <div>
              {[['ar', 'العربية'], ['en', 'English']].map(([code, label]) => (
                <button key={code} className="d-menu-item sub" onClick={() => setLang(code)}>
                  <span className="grow">{label}</span>
                  {lang === code && <Check size={16} />}
                </button>
              ))}
            </div>
          )}

          <div className="d-menu-item static">
            {theme === 'dark' ? <Moon size={18} /> : <Sun size={18} />}
            <span className="grow">{theme === 'dark' ? t('dark_mode') : t('light_mode')}</span>
            <Switch on={theme === 'dark'} onChange={toggleTheme} label={t('dark_mode')} />
          </div>

          <hr />
          {links.map(({ to, key, icon: Icon }) => (
            <button key={to} className={`d-menu-item ${pathname === to ? 'current' : ''}`} onClick={() => go(to)}>
              <Icon size={18} />
              <span className="grow">{t(key)}</span>
            </button>
          ))}

          <hr />
          <button className="d-menu-item danger" onClick={() => go('/login')}>
            <LogOut size={18} />
            <span className="grow">{t('logout')}</span>
          </button>
        </div>
      )}

      <button className={`d-settings-btn ${open ? 'open' : ''}`} onClick={() => setOpen((v) => !v)} aria-haspopup="menu" aria-expanded={open}>
        <SlidersHorizontal size={18} />
        <span className="grow">{t('account_and_settings')}</span>
        <ChevronUp size={16} className="chev" />
      </button>
    </div>
  );
}
