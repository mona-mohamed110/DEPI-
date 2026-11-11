import Icon from '../Icon.jsx';
import { useI18n } from '../../context/I18nContext.jsx';

// كارت الروشتة الكاملة: العنوان = اسم الدكتور + نوع الكشف، وتحته كل الأدوية بجرعتها ومدة استخدامها
export default function RxCard({ rx, children }) {
  const { t, L, fmtDate } = useI18n();
  return (
    <article className="rx-card">
      <header className="rx-head">
        <div className="res-icon"><Icon name="pill" size={22} /></div>
        <div className="m"><b>{L(rx.doctor)} — {t(`visit_${rx.visit}`)}</b><small>{L(rx.specialty)} · {fmtDate(rx.date)}</small></div>
        {children}
      </header>
      {rx.diagnosis && <p className="rx-dx"><span>{t('rx_diagnosis')}:</span> {L(rx.diagnosis)}</p>}
      <ul className="rx-items">
        {rx.items.map((it, i) => (
          <li key={i} className="rx-item">
            <b dir="ltr">{it.name}</b>
            <span><em>{t('rx_dose')}:</em> {L(it.dose)}</span>
            <span><em>{t('rx_duration')}:</em> {L(it.duration)}</span>
          </li>
        ))}
      </ul>
    </article>
  );
}
