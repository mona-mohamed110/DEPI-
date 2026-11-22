import { useEffect, useRef, useState } from 'react';
import Icon from '../Icon.jsx';
import { useI18n } from '../../context/I18nContext.jsx';
import { usePrefs } from '../../context/PrefsContext.jsx';

// أيقونة في النافبار تنزل منها قائمة لتغيير اللغة والوضع (فاتح/داكن)
export default function PrefsMenu() {
  const { t, lang } = useI18n();
  const { setLang, theme, toggleTheme } = usePrefs();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const dark = theme === 'dark';

  useEffect(() => {
    const off = (e) => ref.current && !ref.current.contains(e.target) && setOpen(false);
    const esc = (e) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', off);
    document.addEventListener('keydown', esc);
    return () => { document.removeEventListener('mousedown', off); document.removeEventListener('keydown', esc); };
  }, []);

  return (
    <div className="prefs" ref={ref}>
      <button type="button" className="prefs-btn" aria-label={t('nav_prefs')} aria-expanded={open} aria-haspopup="menu" onClick={() => setOpen((o) => !o)}>
        <Icon name="sliders" size={20} />
      </button>
      {open && (
        <div className="prefs-menu" role="menu">
          <div className="prefs-h">{t('prefs')}</div>
          <div className="prefs-label"><Icon name="languages" size={16} />{t('language')}</div>
          {[['ar', 'العربية'], ['en', 'English']].map(([v, label]) => (
            <button type="button" role="menuitemradio" aria-checked={lang === v} key={v} className={`prefs-item ${lang === v ? 'on' : ''}`} onClick={() => setLang(v)}>
              <span>{label}</span>{lang === v && <Icon name="check" size={16} />}
            </button>
          ))}
          <hr />
          <button type="button" role="menuitem" className="prefs-item" onClick={toggleTheme}>
            <span className="prefs-row"><Icon name={dark ? 'sun' : 'moon'} size={16} />{dark ? t('lightMode') : t('darkMode')}</span>
            <i className={`sw ${dark ? 'on' : ''}`} />
          </button>
        </div>
      )}
    </div>
  );
}
