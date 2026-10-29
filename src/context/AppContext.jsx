import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { dict } from '../i18n.js';

const AppContext = createContext(null);

const read = (key, fallback) => {
  try {
    return localStorage.getItem(key) || fallback;
  } catch {
    return fallback;
  }
};

export function AppProvider({ children }) {
  const [theme, setTheme] = useState(() => read('theme', 'light'));
  const [lang, setLang] = useState(() => read('lang', 'ar'));
  const [toastMsg, setToastMsg] = useState('');

  // الاتجاه واللغة والثيم تُطبَّق على غلاف لوحة المريض (PatientLayout) فقط
  useEffect(() => {
    try {
      localStorage.setItem('theme', theme);
      localStorage.setItem('lang', lang);
    } catch {
      /* storage unavailable */
    }
  }, [theme, lang]);

  useEffect(() => {
    if (!toastMsg) return undefined;
    const id = setTimeout(() => setToastMsg(''), 2200);
    return () => clearTimeout(id);
  }, [toastMsg]);

  const t = useCallback((key) => dict[lang][key] ?? key, [lang]);
  const toggleTheme = useCallback(() => setTheme((v) => (v === 'dark' ? 'light' : 'dark')), []);
  const toast = useCallback((m) => setToastMsg(m), []);

  const value = useMemo(
    () => ({ theme, setTheme, toggleTheme, lang, setLang, t, toast, toastMsg }),
    [theme, toggleTheme, lang, t, toast, toastMsg]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export const useApp = () => useContext(AppContext);
