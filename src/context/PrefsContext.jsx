// اللغة والوضع الداكن للموقع كله (الصفحة الرئيسية + تسجيل الدخول + كل اللوحات) — محفوظين في المتصفح
import { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react';

const Ctx = createContext(null);
export const usePrefs = () => useContext(Ctx);

const read = (k, d) => { try { return localStorage.getItem(k) || d; } catch { return d; } };
const write = (k, v) => { try { localStorage.setItem(k, v); } catch { /* ignore */ } };

export function PrefsProvider({ children }) {
  const [lang, setLangState] = useState(() => (read('shefaa_lang', 'ar') === 'en' ? 'en' : 'ar'));
  const [theme, setThemeState] = useState(() => (read('shefaa_theme', 'light') === 'dark' ? 'dark' : 'light'));

  const setLang = useCallback((l) => { setLangState(l); write('shefaa_lang', l); }, []);
  const setTheme = useCallback((m) => { setThemeState(m); write('shefaa_theme', m); }, []);
  const toggleTheme = useCallback(() => setThemeState((m) => { const n = m === 'dark' ? 'light' : 'dark'; write('shefaa_theme', n); return n; }), []);

  // يقلب الصفحة كلها (html) مع اللغة والثيم
  useEffect(() => {
    const el = document.documentElement;
    el.setAttribute('lang', lang);
    el.setAttribute('dir', lang === 'ar' ? 'rtl' : 'ltr');
    el.setAttribute('data-theme', theme);
    el.style.colorScheme = theme;
  }, [lang, theme]);

  const value = useMemo(() => ({ lang, dir: lang === 'ar' ? 'rtl' : 'ltr', theme, setLang, setTheme, toggleTheme }), [lang, theme, setLang, setTheme, toggleTheme]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
