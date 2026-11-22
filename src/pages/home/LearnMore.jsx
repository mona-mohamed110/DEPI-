import { Link } from 'react-router-dom';
import HomeShell from '../../components/home/HomeShell.jsx';
import Navbar from '../../components/home/Navbar.jsx';
import Footer from '../../components/home/Footer.jsx';
import { useI18n } from '../../context/I18nContext.jsx';

function Content() {
  const { t } = useI18n();
  return (
    <main className="sec"><div className="wrap center">
      <h1 className="sec-title">{t('lm_t1')} <span className="hl">{t('lm_t2')}</span></h1>
      <p className="sec-sub">{t('lm_lead')}</p>
      <div className="lm-grid">{[1, 2, 3].map((n) => <div className="sv-card" key={n}><h3>{t(`lm${n}_t`)}</h3><p>{t(`lm${n}_d`)}</p></div>)}</div>
      <Link to="/" className="btn lg" style={{ marginTop: 32 }}>{t('lm_back')}</Link>
    </div></main>
  );
}
export default function LearnMore() {
  return <HomeShell><Navbar /><Content /><Footer /></HomeShell>;
}
