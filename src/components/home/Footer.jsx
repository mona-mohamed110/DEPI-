import Icon from '../Icon.jsx';
import { useI18n } from '../../context/I18nContext.jsx';
import BrandLogo from '../BrandLogo.jsx';

const COLS = [['ft_support', 's'], ['ft_services', 'v'], ['ft_legal', 'l']];
const SOCIALS = [['facebook', 'Facebook', 'https://www.facebook.com/'], ['instagram', 'Instagram', 'https://www.instagram.com/'], ['linkedin', 'LinkedIn', 'https://www.linkedin.com/'], ['youtube', 'YouTube', 'https://www.youtube.com/']];

export default function Footer() {
  const { t } = useI18n();
  return (
    <footer className="footer">
      <div className="wrap footer-top">
        <div className="footer-brand">
          <BrandLogo />
          <div className="socials">{SOCIALS.map(([ic, label, href]) => <a key={ic} href={href} aria-label={label} target="_blank" rel="noopener noreferrer"><Icon name={ic} size={18} /></a>)}</div>
        </div>
        <nav className="footer-cols" aria-label="footer">
          {COLS.map(([title, p]) => (
            <div key={p}><h4>{t(title)}</h4><ul>{[1, 2, 3, 4, 5].map((n) => <li key={n}><a href="#top">{t(`ft_${p}${n}`)}</a></li>)}</ul></div>
          ))}
        </nav>
      </div>
      <div className="footer-bottom">{t('ft_copy')}</div>
    </footer>
  );
}
