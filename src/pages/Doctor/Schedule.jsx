import { useState } from 'react';
import { useDoctor } from '../../context/DoctorContext.jsx';
import Switch from '../../components/Doctor/Switch.jsx';

const initial = Array.from({ length: 7 }, (_, i) => ({ on: i < 5, from: '10:00', to: '17:00' }));

export default function Schedule() {
  const { t, toast } = useDoctor();
  const [days, setDays] = useState(initial);
  const update = (i, patch) => setDays((d) => d.map((x, j) => (j === i ? { ...x, ...patch } : x)));

  return (
    <section>
      <h1>{t('schedule_title')}</h1>
      <p className="d-sub">{t('schedule_sub')}</p>
      <div className="d-grid d-g2">
        <div className="d-card">
          <h2>{t('weekly_hours')}</h2>
          {days.map((d, i) => (
            <div className="d-row" key={i}>
              <Switch on={d.on} onChange={(v) => update(i, { on: v })} label={t(`d${i}`)} />
              <b className="d-day">{t(`d${i}`)}</b>
              <input type="time" value={d.from} disabled={!d.on} onChange={(e) => update(i, { from: e.target.value })} className="d-time" />
              <span>{t('to')}</span>
              <input type="time" value={d.to} disabled={!d.on} onChange={(e) => update(i, { to: e.target.value })} className="d-time" />
            </div>
          ))}
          <br />
          {/* TODO: أرسل days إلى الـ API */}
          <button className="d-btn" onClick={() => toast(t('saved_hours'))}>{t('save')}</button>
        </div>
      </div>
    </section>
  );
}
