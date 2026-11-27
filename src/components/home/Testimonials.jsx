import { useEffect, useState } from 'react';
import { useI18n } from '../../context/I18nContext.jsx';
import CountUp from '../ui/CountUp.jsx';
import { getTestimonials } from '../../api/reviews.js';

const Card = ({ r, t }) => (
  <figure className="tm-card">
    {r.avatar ? <img className="tm-av" src={r.avatar} alt="" style={{ objectFit: 'cover' }} /> : <span className="tm-av" aria-hidden="true">{(r.name || '?').charAt(0)}</span>}
    <div className="tm-body">
      <blockquote>«{String(r.comment || '').replace(/^[«»"“”\s]+|[«»"“”\s]+$/g, '') || '—'}»</blockquote>
      <figcaption>- {r.name} <small>({t(`tm_role_${r.role}`)})</small></figcaption>
    </div>
  </figure>
);

// آراء المستخدمين التي اختارتها الإدارة + أرقام حقيقية من المنصة (تختفي إن لم يوجد رأي مختار)
export default function Testimonials() {
  const { t } = useI18n();
  const [d, setD] = useState(null);
  useEffect(() => { getTestimonials().then((r) => r && Array.isArray(r.items) && setD(r)).catch(() => {}); }, []);
  if (!d || d.visible === false || !d.items.length) return null;
  const top = d.items.slice(0, 2);
  const bottom = d.items.slice(2, 4);
  const s = d.stats || {};
  const stats = [
    [s.patients || 0, '', 'tm_st_patients'],
    [s.doctors || 0, '', 'tm_st_doctors'],
    [s.labs || 0, '', 'tm_st_labs'],
    ...(s.satisfaction != null ? [[s.satisfaction, '%', 'tm_st_sat']] : []),
  ];
  return (
    <section id="testimonials" className="sec">
      <div className="wrap">
        <div className="tm-head">
          <h2 className="tm-kicker">{t('tm_title')}</h2>
          <p className="tm-big">{t('tm_head')}</p>
          <p className="sec-sub">{t('tm_sub')}</p>
        </div>
        <div className="tm-grid">{top.map((r) => <Card key={r.id} r={r} t={t} />)}</div>
        <div className="tm-stats">
          {stats.map(([v, suffix, k]) => <div key={k}><b><CountUp count={v} suffix={suffix} className="tm-num" /></b><span>{t(k)}</span></div>)}
        </div>
        {bottom.length > 0 && <div className="tm-grid">{bottom.map((r) => <Card key={r.id} r={r} t={t} />)}</div>}
      </div>
    </section>
  );
}
