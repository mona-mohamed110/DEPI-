import { Area, AreaChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import Icon from '../../components/Icon.jsx';
import { Async } from '../../components/ui/States.jsx';
import { useAsync } from '../../components/ui/hooks.js';
import { useI18n } from '../../context/I18nContext.jsx';
import * as api from '../../api/admin.js';

const DAYS = ['sat', 'sun', 'mon', 'tue', 'wed', 'thu', 'fri'];
const COLORS = ['var(--pr)', '#7c3aed', '#0ea5e9', '#94a3b8'];
const ROLES = [['patient', 'adm_u_pt'], ['doctor', 'adm_u_dr'], ['lab', 'adm_u_lab'], ['reception', 'adm_u_rc']];
const SVC = { api: 'adm_svc_api', db: 'adm_svc_db', notif: 'adm_svc_notif', files: 'adm_svc_files', ai: 'adm_svc_ai' };
const tipStyle = { background: 'var(--card)', border: '1px solid var(--bd)', borderRadius: 10, color: 'var(--tx)' };

export default function Monitoring() {
  const { t, num } = useI18n();
  const state = useAsync(() => api.getMonitoring(), []);

  const download = (m) => {
    const rows = [['metric', 'value'], ['booked', m.report.booked], ['access', m.report.access], ['uploaded', m.report.uploaded], ['newAccounts', m.report.newAccounts]];
    const url = URL.createObjectURL(new Blob([rows.map((r) => r.join(',')).join('\n')], { type: 'text/csv' }));
    const a = Object.assign(document.createElement('a'), { href: url, download: 'shefaa-report.csv' });
    a.click(); URL.revokeObjectURL(url);
  };

  return (
    <section>
      <h1>{t('adm_mon_title')}</h1>
      <p className="sub">{t('adm_mon_sub')}</p>
      <div className="note"><Icon name="info" size={18} /><span>{t('adm_mon_note')}</span></div>
      <Async state={state}>{(m) => {
        const users = ROLES.map(([k, label]) => ({ name: t(label), count: m.usersByRole[k] }));
        const total = users.reduce((s, u) => s + u.count, 0);
        const weekly = m.weekly.map((count, i) => ({ day: t(`adm_d_${DAYS[i]}`), count }));
        return (
          <>
            <div className="grid g4">
              {[['adm_mon_online', num(m.online), 'adm_mon_vs', 'users', ''], ['adm_mon_latency', `${num(m.latency)}ms`, 'adm_mon_excellent', 'clock', 'ok'], ['adm_mon_errors', `${num(m.errors)}%`, 'adm_mon_stable', 'alert', 'wn'], ['adm_mon_uptime', `${num(m.uptime)}%`, 'adm_mon_30d', 'activity', 'ok']].map(([k, v, sub, ic, tone]) => (
                <div className="card stat" key={k}><div className={`tile ${tone}`}><Icon name={ic} size={22} /></div><span>{t(k)}</span><b>{v}</b><small className="sub" style={{ margin: 0 }}>{t(sub)}</small></div>
              ))}
            </div>

            <div className="card" style={{ marginTop: 16 }}>
              <h2>{t('adm_mon_weekly')}</h2>
              <div className="chart-box">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={weekly} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                    <defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="var(--pr)" stopOpacity=".35" /><stop offset="100%" stopColor="var(--pr)" stopOpacity="0" /></linearGradient></defs>
                    <CartesianGrid stroke="var(--bd)" vertical={false} />
                    <XAxis dataKey="day" tick={{ fill: 'var(--mu)', fontSize: 12 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: 'var(--mu)', fontSize: 12 }} axisLine={false} tickLine={false} width={40} />
                    <Tooltip contentStyle={tipStyle} formatter={(v) => [`${num(v)} ${t('adm_mon_requests')}`, '']} />
                    <Area type="monotone" dataKey="count" stroke="var(--pr)" strokeWidth={2.5} fill="url(#g)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="grid g3" style={{ marginTop: 16 }}>
              <div className="card">
                <h2>{t('adm_mon_report')}</h2>
                {[['adm_mon_booked', m.report.booked], ['adm_mon_access', m.report.access], ['adm_mon_uploaded', m.report.uploaded], ['adm_mon_newacc', m.report.newAccounts]].map(([k, v]) => (
                  <div className="row" key={k}><span className="m">{t(k)}</span><b>{num(v)}</b></div>
                ))}
                <div className="btn-row"><button type="button" className="btn o" onClick={() => download(m)}><Icon name="download" size={16} />{t('adm_mon_download')}</button></div>
              </div>
              <div className="card">
                <h2>{t('adm_mon_services')}</h2>
                {m.services.map((s) => (
                  <div className="svc" key={s.key}>
                    <span className={`dot ${s.ok ? '' : 'bad'}`} />
                    <div className="m">{t(SVC[s.key])}</div>
                    <span className={`badge ${s.ok ? 'ok' : 'wn'}`}>{s.ok ? t('adm_svc_up') : t('adm_svc_slow')}</span>
                  </div>
                ))}
              </div>
              <div className="card">
                <h2>{t('adm_mon_users_by')}</h2>
                <div className="donut-wrap">
                  <div style={{ position: 'relative', width: 170, height: 170, direction: 'ltr' }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={users} dataKey="count" nameKey="name" innerRadius={55} outerRadius={80} paddingAngle={3} stroke="none">{users.map((u, i) => <Cell key={u.name} fill={COLORS[i]} />)}</Pie>
                        <Tooltip contentStyle={tipStyle} />
                      </PieChart>
                    </ResponsiveContainer>
                    <div style={{ position: 'absolute', inset: 0, display: 'grid', placeContent: 'center', textAlign: 'center', pointerEvents: 'none' }}><b style={{ fontSize: 22 }}>{num(total)}</b><small className="sub" style={{ margin: 0 }}>{t('adm_mon_users_word')}</small></div>
                  </div>
                  <div className="legend">{users.map((u, i) => <span key={u.name}><i style={{ background: COLORS[i] }} />{u.name} <b>{num(u.count)}</b></span>)}</div>
                </div>
              </div>
            </div>
          </>
        );
      }}</Async>
    </section>
  );
}
