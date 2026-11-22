import { Link } from 'react-router-dom';
import { useI18n } from '../../context/I18nContext.jsx';
import aboutImage from '../../assets/about-team.png';

export default function AboutSection() {
  const { t } = useI18n();
  return (
    <section id="about" className="sec">
      <div className="wrap about-box">
        <h2 className="sec-title">{t('ab_t1')} <span className="hl">{t('ab_t2')}</span> {t('ab_t3')}</h2>
        <div className="about-grid">
          <div><p>{t('ab_text')}</p><Link to="/learn-more" className="btn">{t('ab_more')}</Link></div>
          <img className="about-img" src={aboutImage} alt={t('ab_img')} loading="lazy" />
        </div>
      </div>
    </section>
  );
}
