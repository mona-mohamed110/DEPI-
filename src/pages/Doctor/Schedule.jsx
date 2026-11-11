import { useEffect, useState } from 'react';
import Switch from '../../components/ui/Switch.jsx';
import { Async } from '../../components/ui/States.jsx';
import { useAsync } from '../../components/ui/hooks.js';
import { useToast } from '../../components/ui/Toast.jsx';
import { useI18n } from '../../context/I18nContext.jsx';
import * as api from '../../api/doctor.js';

export default function Schedule() {
  const { t } = useI18n();
  const { act } = useToast();
  const state = useAsync(() => api.getSchedule(), []);
  const [days, setDays] = useState(null);
  useEffect(() => { if (state.data) setDays(state.data); }, [state.data]);
  const update = (i, patch) => setDays((d) => d.map((x, j) => (j === i ? { ...x, ...patch } : x)));
  return (
    <section>
      <h1>{t('schedule_title')}</h1>
      <p className="sub">{t('schedule_sub')}</p>
      <Async state={state}>{() => days && (
        <div className="card narrow">
          <h2>{t('weekly_hours')}</h2>
          {days.map((d, i) => (
            <div className="row" key={i}>
              <Switch on={d.on} onChange={(v) => update(i, { on: v })} label={t(`d${i}`)} />
              <b className="day-name">{t(`d${i}`)}</b>
              <input type="time" value={d.from} disabled={!d.on} onChange={(e) => update(i, { from: e.target.value })} className="time" />
              <span>{t('to')}</span>
              <input type="time" value={d.to} disabled={!d.on} onChange={(e) => update(i, { to: e.target.value })} className="time" />
            </div>
          ))}
          <div className="btn-row"><button type="button" className="btn" onClick={() => act(() => api.saveSchedule(days), 'saved_hours')}>{t('save')}</button></div>
        </div>
      )}</Async>
    </section>
  );
}
