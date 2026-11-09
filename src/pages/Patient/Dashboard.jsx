import { Link } from 'react-router-dom';
import Icon from '../../components/Icon.jsx';
import { Async } from '../../components/ui/States.jsx';
import { useAsync } from '../../components/ui/hooks.js';
import { useI18n } from '../../context/I18nContext.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import * as api from '../../api/patient.js';

const ST = { confirmed: ['ok', 'ap_confirmed'], pending: ['wn', 'ap_pending'], rejected: ['dg', 'ap_rejected'], done: ['', 'ap_done'] };

export default function Dashboard() {
  const { t, L, num, fmtDay, fmtTime } = useI18n();
  const { user } = useAuth();
  const state = useAsync(() => api.getDashboard(), []);
  const first = L(user.name).split(' ')[0];

  return (
    <section>
      <div className="hello">
        <h1>{t('greeting', { name: first })}</h1>
        <div className="avatar">{first.charAt(0)}</div>
      </div>
      <p className="hello-sub">{t('dash_sub')}</p>
      <Async state={state}>{(d) => (
        <>
          <div className="grid g3">
            <Link to="/patient/appointments" className="card stat">
              <div className="tile"><Icon name="calendar" size={22} /></div>
              <span>{t('d_next')}</span>
              <b className="sm">{d.next ? `${fmtDay(d.next.date)} · ${fmtTime(d.next.time)}` : t('d_none')}</b>
            </Link>
            <Link to="/patient/prescriptions" className="card stat">
              <div className="tile ok"><Icon name="pill" size={22} /></div>
              <span>{t('d_meds')}</span>
              <b>{t('d_meds_n', { n: num(d.rxCount) })}</b>
            </Link>
            <Link to="/patient/permissions" className="card stat">
              <div className="tile wn"><Icon name="shield" size={22} /></div>
              <span>{t('d_pending')}</span>
              <b>{t('d_pending_n', { n: num(d.permCount) })}</b>
            </Link>
          </div>

          <div className="grid g2" style={{ marginTop: 16 }}>
            <div className="card">
              <h2>{t('d_upcoming')}</h2>
              {d.upcoming.length === 0 ? <div className="state">{t('ap_empty')}</div> : d.upcoming.map((a) => (
                <div className="row" key={a.id}>
                  <div className="av">{L(a.doctor).replace(/^(د\.|Dr\.)\s*/, '').charAt(0)}</div>
                  <div className="m"><b>{L(a.doctor)}</b><small>{L(a.specialty)} · {fmtDay(a.date)} {fmtTime(a.time)}</small></div>
                  <span className={`badge ${ST[a.status]?.[0] || ''}`}>{t(ST[a.status]?.[1] || 'ap_pending')}</span>
                </div>
              ))}
            </div>

            <div className="card">
              <h2>{t('d_alerts')}</h2>
              {d.alerts.length === 0 ? <div className="state">{t('d_no_alerts')}</div> : d.alerts.map((a, i) => (
                <div className="alert-row" key={i}>
                  <Icon name="tube" size={20} />
                  <span>{t('d_alert_result', { title: L(a.title) })}</span>
                </div>
              ))}
            </div>

            <div className="card">
              <h2>{t('d_last_rx')}</h2>
              {d.latestRx ? (
                <>
                  <div className="row" style={{ borderBottom: 0 }}>
                    <div className="m"><b>{L(d.latestRx.doctor)}</b><small>{fmtDay(d.latestRx.date)}</small></div>
                    <Link to="/patient/prescriptions" className="btn s o">{t('view')}</Link>
                  </div>
                  <p className="sub" style={{ margin: 0 }} dir="auto">{d.latestRx.meds.join(' · ')}</p>
                </>
              ) : <div className="state">{t('d_none')}</div>}
            </div>
          </div>
        </>
      )}</Async>
    </section>
  );
}
