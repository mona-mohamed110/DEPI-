import { useMemo, useState } from 'react';
import Icon from '../../components/Icon.jsx';
import { Async } from '../../components/ui/States.jsx';
import { useAsync } from '../../components/ui/hooks.js';
import { useI18n } from '../../context/I18nContext.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import * as api from '../../api/doctor.js';

const FILTERS = ['all', 'done', 'exam', 'wait'];
const TONE = { done: 'ok', exam: '', wait: 'wn' };

function Today({ list }) {
  const { t, L, num, fmtTime } = useI18n();
  const [filter, setFilter] = useState('all');
  const [q, setQ] = useState('');
  const shown = useMemo(() => list.filter((a) => (filter === 'all' || a.status === filter) && L(a.name).toLowerCase().includes(q.trim().toLowerCase())), [list, filter, q, L]);
  const count = (f) => (f === 'all' ? list.length : list.filter((a) => a.status === f).length);
  return (
    <div className="card" style={{ marginTop: 16 }}>
      <h2>{t('stat_today')}</h2>
      <div className="search" style={{ marginBottom: 12 }}><Icon name="search" size={18} /><input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t('search_quick')} /></div>
      <div className="chips" style={{ marginBottom: 8 }}>
        {FILTERS.map((f) => <button type="button" key={f} className={`chip ${filter === f ? 'on' : ''}`} onClick={() => setFilter(f)}>{f === 'all' ? t('f_all') : t(`s_${f}`)} ({num(count(f))})</button>)}
      </div>
      {shown.length === 0 && <div className="state">{t('no_results')}</div>}
      {shown.map((a) => (
        <div className="row" key={a.id}>
          <div className="av">{L(a.name).charAt(0)}</div>
          <div className="m"><b>{L(a.name)}</b><small>{fmtTime(a.time)}</small></div>
          <span className={`badge ${TONE[a.status] || ''}`}>{t(`s_${a.status}`)}</span>
        </div>
      ))}
    </div>
  );
}

export default function Dashboard() {
  const { t, L, num } = useI18n();
  const { user } = useAuth();
  const state = useAsync(() => api.getDashboard(), []);
  return (
    <section>
      <h1>{t('greeting', { name: L(user.name) })}</h1>
      <p className="sub">{t('dash_sub')}</p>
      <Async state={state}>{(d) => (
        <>
          <div className="grid g3">
            {[['stat_today', d.stats.today, 'calendar', ''], ['stat_waiting', d.stats.waiting, 'clock', 'wn'], ['stat_patients', d.stats.patients, 'users', 'ok']].map(([k, v, ic, tone]) => (
              <div className="card stat" key={k}><div className={`tile ${tone}`}><Icon name={ic} size={22} /></div><span>{t(k)}</span><b>{num(v)}</b></div>
            ))}
          </div>
          <Today list={d.appointments} />
        </>
      )}</Async>
    </section>
  );
}
