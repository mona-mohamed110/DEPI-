import { useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import { useDoctor } from '../../context/DoctorContext.jsx';
import { appointments, matchesName, statusBadge } from '../../data/doctorData.js';

const FILTERS = ['all', 'done', 'exam', 'wait'];

// مواعيد اليوم مع فلتر بالحالة وبحث سريع
export default function TodayAppointments() {
  const { t, fmt, L, fmtTime } = useDoctor();
  const [filter, setFilter] = useState('all');
  const [q, setQ] = useState('');

  const list = useMemo(
    () => appointments.filter((a) => (filter === 'all' || a.status === filter) && matchesName(a.n, q)),
    [filter, q]
  );

  const count = (f) => (f === 'all' ? appointments.length : appointments.filter((a) => a.status === f).length);

  return (
    <div className="d-card">
      <h2>{t('stat_today')}</h2>

      <div className="d-search">
        <Search size={17} />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t('search_quick')} />
      </div>

      <div className="d-chips">
        {FILTERS.map((f) => (
          <button key={f} className={`d-chip ${filter === f ? 'on' : ''}`} onClick={() => setFilter(f)}>
            {f === 'all' ? t('f_all') : t(`s_${f}`)} ({fmt(count(f))})
          </button>
        ))}
      </div>

      {list.length === 0 && <p className="d-sub">{t('no_results')}</p>}
      {list.map((a) => (
        <div className="d-row" key={a.id}>
          <div className="d-av">{L(a.n).charAt(0)}</div>
          <div className="d-m">
            <b>{L(a.n)}</b>
            <small>{fmtTime(a.time)}</small>
          </div>
          <span className={`d-badge ${statusBadge[a.status]}`}>{t(`s_${a.status}`)}</span>
        </div>
      ))}
    </div>
  );
}
