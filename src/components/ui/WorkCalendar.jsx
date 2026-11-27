import { useMemo, useState } from 'react';
import Icon from '../Icon.jsx';
import { useI18n } from '../../context/I18nContext.jsx';
import { dayOn } from '../../utils/schedule.js';

const pad = (n) => String(n).padStart(2, '0');
const ymd = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const MAX_MONTHS_AHEAD = 3;

// تقويم شهري: الأيام اللي الطبيب بيشتغل فيها بس هي القابلة للاختيار (من ساعات عمله)
export default function WorkCalendar({ value, onChange, schedule }) {
  const { locale, dir } = useI18n();
  const today = useMemo(() => { const d = new Date(); d.setHours(0, 0, 0, 0); return d; }, []);
  const [view, setView] = useState(() => new Date(today.getFullYear(), today.getMonth(), 1));

  const first = view;
  const monthsDiff = (view.getFullYear() - today.getFullYear()) * 12 + view.getMonth() - today.getMonth();
  const canPrev = monthsDiff > 0;
  const canNext = monthsDiff < MAX_MONTHS_AHEAD;
  const move = (n) => setView(new Date(view.getFullYear(), view.getMonth() + n, 1));

  // السبت أول الأسبوع
  const order = [6, 0, 1, 2, 3, 4, 5];
  const head = order.map((dow) => new Date(2023, 0, 1 + dow).toLocaleDateString(locale, { weekday: 'short' }));
  const lead = order.indexOf(first.getDay());
  const count = new Date(first.getFullYear(), first.getMonth() + 1, 0).getDate();
  const cells = [...Array(lead).fill(null), ...Array.from({ length: count }, (_, i) => new Date(first.getFullYear(), first.getMonth(), i + 1))];

  const prevIcon = dir === 'rtl' ? 'chevR' : 'chevL';
  const nextIcon = dir === 'rtl' ? 'chevL' : 'chevR';

  return (
    <div className="wc">
      <div className="wc-nav">
        <button type="button" className="wc-arrow" disabled={!canPrev} onClick={() => move(-1)} aria-label="prev"><Icon name={prevIcon} size={16} /></button>
        <b>{first.toLocaleDateString(locale, { month: 'long', year: 'numeric' })}</b>
        <button type="button" className="wc-arrow" disabled={!canNext} onClick={() => move(1)} aria-label="next"><Icon name={nextIcon} size={16} /></button>
      </div>
      <div className="wc-grid">
        {head.map((h, i) => <span key={i} className="wc-h">{h}</span>)}
        {cells.map((d, i) => {
          if (!d) return <span key={`e${i}`} />;
          const key = ymd(d);
          const off = d < today || (!!schedule && !dayOn(schedule, d.getDay()));
          return (
            <button
              type="button"
              key={key}
              disabled={off}
              className={`wc-d ${value === key ? 'on' : ''} ${key === ymd(today) ? 'today' : ''}`}
              onClick={() => onChange(key)}
            >{d.getDate()}</button>
          );
        })}
      </div>
    </div>
  );
}
