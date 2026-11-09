import { I18nProvider } from '../../context/I18nContext.jsx';
import { usePrefs } from '../../context/PrefsContext.jsx';
import { homeDict } from '../../i18n/home.js';
import '../../styles/theme.css';
import '../../styles/home.css';

// غلاف مشترك للصفحة الرئيسية وصفحات الدخول والبحث: ثيم + لغة + اتجاه
function Root({ className = '', children }) {
  const { theme, lang } = usePrefs();
  return <div className={`app-root home-app ${className}`} data-theme={theme} dir={lang === 'ar' ? 'rtl' : 'ltr'} lang={lang}>{children}</div>;
}
export default function HomeShell({ dict = homeDict, className, children }) {
  return <I18nProvider dict={dict}><Root className={className}>{children}</Root></I18nProvider>;
}
