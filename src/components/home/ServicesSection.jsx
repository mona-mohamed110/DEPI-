import Icon from '../Icon.jsx';
import { useI18n } from '../../context/I18nContext.jsx';

const ITEMS = [['bot', 1], ['mapPin', 2], ['file', 3], ['flask', 4], ['shield', 5]];

export default function ServicesSection() {
  const { t } = useI18n();
  return (
    <section id="services" className="sec">
      <div className="wrap">
        <h2 className="sec-title">{t('sv_title1')} <span className="hl">{t('sv_title2')}</span> {t('sv_title3')}</h2>
        <p className="sec-sub">{t('sv_sub')}</p>
        <div className="sv-grid">
          {ITEMS.map(([ic, n]) => (
            <article className="sv-card" key={n}>
              <span className="sv-ic"><Icon name={ic} size={22} /></span>
              <h3>{t(`sv${n}_t`)}</h3>
              <p>{t(`sv${n}_d`)}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
