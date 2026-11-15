
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from '../../components/Icon.jsx';
import { Async } from '../../components/ui/States.jsx';
import { useAsync } from '../../components/ui/hooks.js';
import { useI18n } from '../../context/I18nContext.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import * as api from '../../api/doctor.js';

const FILTERS = ['all', 'done', 'exam', 'wait'];
const TONE = { done: 'ok', exam: '', wait: 'wn' };

function localDate() {
  const d = new Date();

  return [
    d.getFullYear(),
    String(d.getMonth() + 1).padStart(2, '0'),
    String(d.getDate()).padStart(2, '0'),
  ].join('-');
}

function Today({ list, selectedDate, onDateChange }) {
  const { t, L, num, fmtTime, fmtDate, lang } = useI18n();
  const nav = useNavigate();

  const [filter, setFilter] = useState('all');
  const [q, setQ] = useState('');

  const shown = useMemo(
    () =>
      list.filter(
        (a) =>
          (filter === 'all' || a.status === filter) &&
          L(a.name).toLowerCase().includes(q.trim().toLowerCase())
      ),
    [list, filter, q, L]
  );

  const count = (f) =>
    f === 'all' ? list.length : list.filter((a) => a.status === f).length;

  return (
    <div className="card" style={{ marginTop: 16 }}>
      {/* العنوان واختيار التاريخ */}
      <div
        className="row"
        style={{
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 12,
        }}
      >
        <h2 style={{ margin: 0 }}>{t('stat_today')}</h2>

        <label
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            border: '1px solid var(--border, #ddd)',
            borderRadius: 8,
            padding: '7px 10px',
            cursor: 'pointer',
            maxWidth: 180,
          }}
        >
          <Icon name="calendar" size={18} />

          <input
            type="date"
            value={selectedDate}
            onChange={(e) => {
              if (e.target.value) onDateChange(e.target.value);
            }}
            aria-label={lang === 'ar' ? 'اختيار التاريخ' : 'Select date'}
            style={{
              width: 135,
              border: 'none',
              outline: 'none',
              background: 'transparent',
              color: 'inherit',
              fontSize: 13,
              cursor: 'pointer',
            }}
          />
        </label>
      </div>

      <p className="sub" style={{ marginTop: 6 }}>
        {fmtDate(selectedDate)}
      </p>

      <div className="search" style={{ marginBottom: 12 }}>
        <Icon name="search" size={18} />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={t('search_quick')}
        />
      </div>

      {/* الفلاتر الأصلية كما هي */}
      <div className="chips" style={{ marginBottom: 8 }}>
        {FILTERS.map((f) => (
          <button
            type="button"
            key={f}
            className={`chip ${filter === f ? 'on' : ''}`}
            onClick={() => setFilter(f)}
          >
            {f === 'all' ? t('f_all') : t(`s_${f}`)} ({num(count(f))})
          </button>
        ))}
      </div>

      {shown.length === 0 && (
        <div className="state">{t('no_results')}</div>
      )}

      {shown.map((a) => (
        <div className="row" key={a.id}>
          <div className="av">{L(a.name).charAt(0)}</div>

          <div className="m">
            <b>{L(a.name)}</b>
            <small>{fmtTime(a.time)}</small>
          </div>

          <span className={`badge ${TONE[a.status] || ''}`}>
            {t(`s_${a.status}`)}
          </span>

          <button
  type="button"
  className="btn s"
  disabled={!a.patientId || a.status === 'done'}
  onClick={() => {
    if (!a.patientId || a.status === 'done') return;

    nav(`/doctor/exam?p=${a.patientId}&booking=${a.id}`);
  }}
>
  {a.status === 'done' ? 'تم الكشف' : t('btn_exam')}
</button>
        </div>
      ))}
    </div>
  );
}

export default function Dashboard() {
  const { t, L, num } = useI18n();
  const { user } = useAuth();

  const [selectedDate, setSelectedDate] = useState(localDate);

  const state = useAsync(
    () => api.getDashboard(selectedDate, selectedDate.slice(0, 7)),
    [selectedDate]
  );

  return (
    <section>
      <h1>{t('greeting', { name: L(user.name) })}</h1>
      <p className="sub">{t('dash_sub')}</p>

      <Async state={state}>
        {(d) => (
          <>
            <div className="grid g3">
              {[
                ['stat_today', d.stats.today, 'calendar', ''],
                ['stat_waiting', d.stats.waiting, 'clock', 'wn'],
                ['stat_patients', d.stats.patients, 'users', 'ok'],
                ['stat_prescriptions', d.stats.prescriptions, 'pill', 'ok'],
              ].map(([k, v, ic, tone]) => (
                <div className="card stat" key={k}>
                  <div className={`tile ${tone}`}>
                    <Icon name={ic} size={22} />
                  </div>

                  <span>{t(k)}</span>
                  <b>{num(v ?? 0)}</b>
                </div>
              ))}
            </div>

            <Today
              list={d.appointments}
              selectedDate={selectedDate}
              onDateChange={setSelectedDate}
            />
          </>
        )}
      </Async>
    </section>
  );
}
