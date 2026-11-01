import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { dictDoctor } from '../i18nDoctor.js';

const DoctorContext = createContext(null);

const read = (key, fallback) => {
  try {
    return localStorage.getItem(key) || fallback;
  } catch {
    return fallback;
  }
};

export function DoctorProvider({ children }) {
  const [theme, setTheme] = useState(() => read('doctor-theme', 'light'));
  const [lang, setLang] = useState(() => read('doctor-lang', 'ar'));
  const [toastMsg, setToastMsg] = useState('');

  useEffect(() => {
    try {
      localStorage.setItem('doctor-theme', theme);
      localStorage.setItem('doctor-lang', lang);
    } catch {
      /* storage unavailable */
    }
  }, [theme, lang]);

  useEffect(() => {
    if (!toastMsg) return undefined;
    const id = setTimeout(() => setToastMsg(''), 2200);
    return () => clearTimeout(id);
  }, [toastMsg]);

  const t = useCallback((key) => dictDoctor[lang][key] ?? key, [lang]);

  // أدوات تنسيق حسب اللغة: أرقام وتواريخ وأوقات وبيانات ثنائية اللغة
  const locale = lang === 'ar' ? 'ar-EG' : 'en-US';
  const fmt = useCallback((n) => Number(n).toLocaleString(locale), [locale]);
  const L = useCallback((v) => (v && typeof v === 'object' ? v[lang] : v), [lang]);
  const fmtTime = useCallback((hhmm) => {
    const [h, m] = hhmm.split(':').map(Number);
    return new Date(2000, 0, 1, h, m).toLocaleTimeString(locale, { hour: 'numeric', minute: '2-digit' });
  }, [locale]);
  const fmtDate = useCallback(
    (iso) => new Date(`${iso}T00:00:00`).toLocaleDateString(locale, { day: 'numeric', month: 'long', year: 'numeric' }),
    [locale]
  );
  const toggleTheme = useCallback(() => setTheme((v) => (v === 'dark' ? 'light' : 'dark')), []);
  const toast = useCallback((m) => setToastMsg(m), []);

  const value = useMemo(
    () => ({ theme, toggleTheme, lang, setLang, t, toast, toastMsg, fmt, L, fmtTime, fmtDate }),
    [theme, toggleTheme, lang, t, toast, toastMsg, fmt, L, fmtTime, fmtDate]
  );
  return <DoctorContext.Provider value={value}>{children}</DoctorContext.Provider>;
}

export const useDoctor = () => useContext(DoctorContext);
