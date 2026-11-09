// الترجمة: كل جزء من المشروع له ملف ترجمة منفصل في src/i18n ويتمرر هنا
import { createContext, useContext, useMemo } from 'react';
import { usePrefs } from './PrefsContext.jsx';

const Ctx = createContext(null);
export const useI18n = () => useContext(Ctx);

export function I18nProvider({ dict, children }) {
  const { lang, dir, theme } = usePrefs();
  const value = useMemo(() => {
    const locale = lang === 'ar' ? 'ar-EG' : 'en-US';
    const t = (key, vars) => {
      let s = dict[lang]?.[key] ?? dict.ar?.[key] ?? key;
      if (vars && typeof s === 'string') Object.keys(vars).forEach((k) => { s = s.replaceAll(`{${k}}`, vars[k]); });
      return s;
    };
    // L: بيقبل نص عادي أو {ar,en}
    const L = (v) => (v && typeof v === 'object' ? v[lang] ?? v.ar ?? v.en ?? '' : v ?? '');
    const num = (n) => Number(n ?? 0).toLocaleString(locale);
    const toDate = (x) => (x instanceof Date ? x : /^\d{4}-\d{2}-\d{2}$/.test(String(x)) ? new Date(`${x}T00:00:00`) : new Date(x));
    const fmtDate = (x) => (x ? toDate(x).toLocaleDateString(locale, { day: 'numeric', month: 'long', year: 'numeric' }) : '—');
    const fmtDay = (x) => toDate(x).toLocaleDateString(locale, { weekday: 'long', day: 'numeric', month: 'long' });
    const fmtDateTime = (x) => (x ? toDate(x).toLocaleString(locale, { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' }) : '—');
    // "HH:MM" أو ISO
    const fmtTime = (x) => {
      if (!x) return '—';
      const m = /^(\d{1,2}):(\d{2})$/.exec(String(x));
      const d = m ? new Date(2000, 0, 1, +m[1], +m[2]) : new Date(x);
      return d.toLocaleTimeString(locale, { hour: 'numeric', minute: '2-digit' });
    };
    const ago = (x) => {
      const mins = Math.max(1, Math.round((Date.now() - new Date(x).getTime()) / 60000));
      if (mins < 60) return t('ago_min', { n: num(mins) });
      if (mins < 1440) return t('ago_hour', { n: num(Math.round(mins / 60)) });
      return t('ago_day', { n: num(Math.round(mins / 1440)) });
    };
    return { lang, dir, theme, locale, t, L, num, fmtDate, fmtDay, fmtDateTime, fmtTime, ago };
  }, [dict, lang, dir, theme]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
