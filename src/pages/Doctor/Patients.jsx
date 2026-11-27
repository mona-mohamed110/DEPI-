
import { useState } from 'react';
import {  useNavigate } from 'react-router-dom';
import Icon from '../../components/Icon.jsx';
import { Async } from '../../components/ui/States.jsx';
import { useAsync } from '../../components/ui/hooks.js';
import { useI18n } from '../../context/I18nContext.jsx';
import * as api from '../../api/doctor.js';

export default function Patients() {
  const { t, L, num, fmtDate, fmtTime } = useI18n();
  const nav = useNavigate();
  const [q, setQ] = useState('');
const state = useAsync(() => api.getPatients(), []);
  return (
    <section>
      <h1>{t('patients_title')}</h1>
      <p className="sub">{t('patients_sub')}</p>

      <div className="card">
        <div className="search" style={{ marginBottom: 8 }}>
          <Icon name="search" size={18} />

          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={t('search_patient')}
          />
        </div>

        <Async state={state}>
          {(all) => {
            // مرضى اليوم فقط (اللي ليهم حجز النهارده)
            const todays = all.filter((p) => p.todayBooking);
            const list = todays.filter((p) =>
              L(p.name)
                .toLowerCase()
                .includes(q.trim().toLowerCase())
            );

            return list.length === 0 ? (
              <div className="state">
                {todays.length ? (
                  t('no_results')
                ) : (
                  <>
                    {all.length ? t('no_patients_today') : t('no_patients')}
                    <br />
                    <small>{all.length ? t('no_patients_today_hint') : t('no_patients_hint')}</small>
                  </>
                )}
              </div>
            ) : (
              list.map((p) => {
                const booking = p.todayBooking;

                const canExam =
                  booking &&
                  ['pending', 'confirmed'].includes(
                    booking.status
                  );

                const examDone = booking?.status === 'done';

                return (
                  <div className="row" key={p.id}>
                    <div className="av">
                      {L(p.name).charAt(0)}
                    </div>

                    <div className="m">
                      <b>{L(p.name)}</b>

                      <small>
                        {p.age != null
                          ? `${num(p.age)} ${t('years')}`
                          : '—'}
                        {' · '}
                        {p.chronic.length
                          ? p.chronic.map(L).join('، ')
                          : t('fv_none')}
                      </small>
                    </div>

                    {booking.time && <span className="badge">{fmtTime(booking.time)}</span>}

                    {booking && (
                      <span
                        className={`badge ${
                          examDone
                            ? 'ok'
                            : booking.status === 'pending'
                              ? 'wn'
                              : ''
                        }`}
                      >
                        {examDone
                          ? 'تم الكشف'
                          : booking.status === 'pending'
                            ? t('s_wait')
                            : t('s_exam')}
                      </span>
                    )}

                    <button
                      type="button"
                      className="btn o s"
                      onClick={() =>
                        nav(`/doctor/patient-file?p=${p.id}`)
                      }
                    >
                      {t('btn_file')}
                    </button>

                    <button
                      type="button"
                      className="btn s"
                      disabled={!canExam}
                      onClick={() => {
                        if (!canExam) return;

                        nav(
                          `/doctor/exam?p=${p.id}&booking=${booking.id}`
                        );
                      }}
                    >
                      {examDone ? 'تم الكشف' : t('btn_exam')}
                    </button>
                  </div>
                );
              })
            );
          }}
        </Async>
      </div>
    </section>
  );
}
