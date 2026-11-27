import { useI18n } from '../../context/I18nContext.jsx';
import doc1 from '../../assets/274ee88b4ba090887500f714810fb576dab7b349.png';

export default function HowItWorks() {
  const { t } = useI18n();
  return (
    <section id="how-it-works" className="sec">
      <div className="wrap">
        <h2 className="sec-title">{t('hw_t1')} <span className="hl">{t('hw_t2')}</span> {t('hw_t3')}</h2>
        <p className="sec-sub">{t('hw_sub')}</p>
        <div className="how-grid">
          <div className="steps">
            {[1, 2, 3].map((n) => (
              <article className="step" key={n}><div className="step-n">{n}</div><div><h3>{t(`hw${n}_t`)}</h3><p>{t(`hw${n}_d`)}</p></div></article>
            ))}
          </div>
          <div className="how-art"><img src={doc1} alt="" loading="lazy" /><div className="how-badge">★ {t('hw_badge')}</div></div>
        </div>

      </div>
    </section>
  );
}
