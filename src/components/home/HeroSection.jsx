import { Link } from 'react-router-dom';
import Icon from '../Icon.jsx';
import { useI18n } from '../../context/I18nContext.jsx';
import Group1 from '../../assets/Group 1.png';

export default function HeroSection() {
  const { t, num, dir } = useI18n();
  return (
    <section id="home" className="hero">
      <div className="hero-grid">
        <div className="hero-text">
          <h1>{t('hero_t1')} <span className="hl">{t('hero_hl')}</span><br />{t('hero_t2')}</h1>
          <p>{t('hero_desc')}</p>
          <Link to="/login" className="btn lg">{t('hero_cta')}<Icon name={dir === 'rtl' ? 'arrowL' : 'arrowR'} size={18} /></Link>
        </div>
        <div className="hero-art">
          <div className="hero-circle" />
          <img src={Group1} alt="" className="hero-doc" />
          <div className="float f-book"><Icon name="star" size={16} /><span>{t('hero_booking')}</span></div>
          <div className="float f-cust"><b>+{num(2400)}</b><span>{t('hero_happy')}</span><small>★★★★★ {t('hero_rating')}</small></div>
          <div className="float f-quote"><span className="q">“</span><p>{t('hero_quote')}</p></div>
        </div>
      </div>
      <div className="hero-search">
        <Link to="/ClinicLabSearch" className="btn lg"><Icon name="stethoscope" size={18} />{t('hero_search')}<Icon name="search" size={16} /></Link>
      </div>
    </section>
  );
}
