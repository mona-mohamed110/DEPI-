import { useEffect, useRef, useState } from 'react';
import { useI18n } from '../../context/I18nContext.jsx';
import doc1 from '../../assets/274ee88b4ba090887500f714810fb576dab7b349.png';
import doc2 from '../../assets/e2a5b7fb191c4fe5f86a038fa314f7425339cd7d.png';
import doc3 from '../../assets/998812e9dc462bbde9dab5699a17e50fd8f50dda.png';
import doc4 from '../../assets/4eaea67a8370b78ad225c6d11ccacd4e1b7de8f5.png';
import doc5 from '../../assets/fa0c789d121f218650c955cb43aa5eb4666ffa9d.png';

const STATS = [[10000, '+', 'st1'], [2500, '+', 'st2'], [98, '%', 'st3'], [200, '+', 'st4']];

// رقم بيتحرك لما يظهر على الشاشة
function StatNumber({ count, suffix }) {
  const { num } = useI18n();
  const ref = useRef(null);
  const [val, setVal] = useState(count);
  useEffect(() => {
    const el = ref.current;
    if (!el || !('IntersectionObserver' in window)) return undefined;
    let frame;
    const obs = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return;
      obs.disconnect();
      const start = performance.now();
      const tick = (now) => {
        const p = Math.min((now - start) / 1100, 1);
        setVal(Math.round(count * (1 - (1 - p) ** 3)));
        if (p < 1) frame = requestAnimationFrame(tick);
      };
      frame = requestAnimationFrame(tick);
    }, { threshold: 0.45 });
    obs.observe(el);
    return () => { obs.disconnect(); cancelAnimationFrame(frame); };
  }, [count]);
  return <div className="stat-number" ref={ref}>{num(val)}{suffix}</div>;
}

const Testi = ({ img, n }) => {
  const { t } = useI18n();
  return (
    <article className="ts-card"><img className="ts-av" src={img} alt="" loading="lazy" /><p>«{t(`ts${n}_q`)}»<br /><strong>– {t(`ts${n}_n`)}</strong></p></article>
  );
};

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

        <h2 className="sec-title" style={{ marginTop: 70 }}><span className="hl">{t('ts_t1')}</span><br />{t('ts_t2')}</h2>
        <p className="sec-sub">{t('ts_sub')}</p>
        <div className="ts-grid"><Testi img={doc2} n={1} /><Testi img={doc3} n={2} /></div>
        <div className="stats">{STATS.map(([c, s, k]) => <div key={k}><StatNumber count={c} suffix={s} /><div className="stat-label">{t(k)}</div></div>)}</div>
        <div className="ts-grid"><Testi img={doc4} n={3} /><Testi img={doc5} n={4} /></div>
      </div>
    </section>
  );
}
