// بيقرأ اللغة والثيم من الـ AppContext (نفس اللي PatientLayout بيطبّقه على الغلاف)
// ويدّي t مع دعم المتغيرات {n}، والاتجاه، واللغة المحلية للتواريخ.
import { useCallback, useMemo } from "react";
import { useApp } from "../../context/AppContext.jsx";
import { dict } from "../../i18n.js";

export default function usePatientPrefs() {
  const { lang, theme } = useApp();

  const t = useCallback((key, vars) => {
    let x = dict[lang]?.[key] ?? dict.ar?.[key] ?? key;
    if (vars) Object.keys(vars).forEach((k) => { x = x.replace(`{${k}}`, vars[k]); });
    return x;
  }, [lang]);

  return useMemo(() => ({
    lang,
    theme: theme === "dark" ? "dark" : "light",
    dark: theme === "dark",
    dir: lang === "ar" ? "rtl" : "ltr",
    locale: dict[lang]?.locale || (lang === "ar" ? "ar-EG" : "en-US"),
    t,
  }), [lang, theme, t]);
}
