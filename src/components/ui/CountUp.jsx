import { useEffect, useRef, useState } from 'react';
import { useI18n } from '../../context/I18nContext.jsx';

// رقم يعدّ من الصفر إلى قيمته عند ظهوره على الشاشة (نفس تأثير أرقام الصفحة الرئيسية)
export default function CountUp({ count, suffix = '', className = 'stat-number' }) {
  const { num } = useI18n();
  const ref = useRef(null);
  const [val, setVal] = useState(count);
  useEffect(() => {
    setVal(count);
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
  return <span className={className} ref={ref}>{num(val)}{suffix}</span>;
}
