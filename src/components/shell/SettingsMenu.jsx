import { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import Icon from '../Icon.jsx';
import { useI18n } from '../../context/I18nContext.jsx';
import { usePrefs } from '../../context/PrefsContext.jsx';
import { useAuth } from '../../context/AuthContext.jsx';

// قائمة الحساب والإعدادات أسفل السايدبار (نفس الشكل في كل اللوحات)
export default function SettingsMenu({ links = [] }) {
  const { t, lang } = useI18n();
  const { setLang, theme, toggleTheme } = usePrefs();
  const { logout } = useAuth();
  const [open, setOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const ref = useRef(null);
  const { pathname } = useLocation();
  const nav = useNavigate();
  const dark = theme === 'dark';

  useEffect(() => { setOpen(false); setLangOpen(false); }, [pathname]);
  useEffect(() => {
    const off = (e) => { if (ref.current && !ref.current.contains(e.target)) { setOpen(false); setLangOpen(false); } };
    const esc = (e) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', off);
    document.addEventListener('keydown', esc);
    return () => { document.removeEventListener('mousedown', off); document.removeEventListener('keydown', esc); };
  }, []);

  const out = async () => { await logout(); nav('/login', { replace: true }); };

  return (
    <div ref={ref} className="set">
      {open && (
        <div className="menu">
          <div className="menu-h">{t('prefs')}</div>
          <button type="button" className={`mi ${langOpen ? 'active' : ''}`} aria-expanded={langOpen} onClick={() => setLangOpen((o) => !o)}>
            <Icon name="languages" size={18} /><span>{t('language')}</span>
            <em>{t('langName')}</em>
            <span className={`lchev ${langOpen ? 'open' : ''}`}><Icon name={lang === 'ar' ? 'chevL' : 'chevR'} size={16} /></span>
          </button>
          {langOpen && (
            <div className="langs">
              {[['ar', 'العربية'], ['en', 'English']].map(([v, label]) => (
                <button type="button" key={v} className={`lang ${lang === v ? 'on' : ''}`} onClick={() => setLang(v)}>
                  <span>{label}</span>{lang === v && <Icon name="check" size={16} />}
                </button>
              ))}
            </div>
          )}
          <div className="mi" role="button" tabIndex={0} onClick={toggleTheme} onKeyDown={(e) => e.key === 'Enter' && toggleTheme()}>
            <Icon name={dark ? 'sun' : 'moon'} size={18} /><span>{dark ? t('lightMode') : t('darkMode')}</span>
            <i className={`sw ${dark ? 'on' : ''}`} />
          </div>
          {links.length > 0 && <hr className="hr" />}
          {links.map((l) => (
            <Link key={l.to} to={l.to} className="mi"><Icon name={l.icon} size={18} /><span>{t(l.key)}</span></Link>
          ))}
          <hr className="hr" />
          <button type="button" className="mi danger" onClick={out}><Icon name="logout" size={18} /><span>{t('logout')}</span></button>
        </div>
      )}
      <button type="button" className="set-btn" aria-expanded={open} onClick={() => setOpen((o) => !o)}>
        <Icon name="sliders" size={20} /><span>{t('settingsBtn')}</span>
        <span className="chev"><Icon name={open ? 'chevD' : 'chevU'} size={16} /></span>
      </button>
    </div>
  );
}
