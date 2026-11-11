import { usePrefs } from '../context/PrefsContext.jsx';
import logo from '../assets/logo.png';
import logoDark from '../assets/logo-darkMode.png';

// اللوجو الوحيد في المشروع: بيتبدل تلقائياً بين logo.png (فاتح) و logo-darkMode.png (داكن)
// لتغيير الصورة: استبدل الملفين في src/assets بنفس الأسماء.
export default function BrandLogo({ className = '', alt = 'SHEFAA', ...rest }) {
  const { theme } = usePrefs();
  return <img className={`brand-logo ${className}`.trim()} src={theme === 'dark' ? logoDark : logo} alt={alt} {...rest} />;
}
