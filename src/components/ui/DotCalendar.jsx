import { useState } from 'react';
import Icon from '../Icon.jsx';
import { useI18n } from '../../context/I18nContext.jsx';

const pad = (n) => String(n).padStart(2, '0');
export const ymd = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

// تقويم المواعيد: نقطة تحت اليوم الذي فيه موعد، والضغط على يوم يصفّي القائمة عليه
export default function DotCalendar({ days, value, onChange }) {
  const { locale, dir } = useI18n();
  const todayKey = ymd(new Date());
  const [view, setView] = useState(() => { const d = new Date(); return new Date(d.getFullYear(), d.getMonth(), 1); });
  const move = (n) => setView(new Date(view.getFullYear(), view.getMonth() + n, 1));
  const order = [6, 0, 1, 2, 3, 4, 5];
  const head = order.map((dow) => new Date(2023, 0, 1 + dow).toLocaleDateString(locale, { weekday: 'short' }));
  const lead = order.indexOf(view.getDay());
  const count = new Date(view.getFullYear(), view.getMonth() + 1, 0).getDate();
  const cells = [...Array(lead).fill(null), ...Array.from({ length: count }, (_, i) => new Date(view.getFullYear(), view.getMonth(), i + 1))];
  const prevIcon = dir === 'rtl' ? 'chevR' : 'chevL';
  const nextIcon = dir === 'rtl' ? 'chevL' : 'chevR';
  return (
    <div className="apc">
      <div className="wc-nav">
        <button type="button" className="wc-arrow" onClick={() => move(-1)} aria-label="prev"><Icon name={prevIcon} size={16} /></button>
        <b>{view.toLocaleDateString(locale, { month: 'long', year: 'numeric' })}</b>
        <button type="button" className="wc-arrow" onClick={() => move(1)} aria-label="next"><Icon name={nextIcon} size={16} /></button>
      </div>
      <div className="wc-grid">
        {head.map((h, i) => <span key={i} className="wc-h">{h}</span>)}
        {cells.map((d, i) => {
          if (!d) return <span key={`e${i}`} />;
          const k = ymd(d);
          const n = days[k] || 0;
          return (
            <button type="button" key={k} onClick={() => onChange(value === k ? '' : k)}
              className={`wc-d apc-d ${value === k ? 'on' : ''} ${k === todayKey ? 'today' : ''} ${n ? 'has' : ''}`}>
              {d.getDate()}{n > 0 && <i className="apc-dot" />}
            </button>
          );
        })}
      </div>
    </div>
  );
}
