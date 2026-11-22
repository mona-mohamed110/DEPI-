
import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import { useEffect, useState } from 'react';
import Icon from '../../components/Icon.jsx';
import { Async } from '../../components/ui/States.jsx';
import { useAsync } from '../../components/ui/hooks.js';
import { useI18n } from '../../context/I18nContext.jsx';
import * as api from '../../api/admin.js';

const DAYS = ['sat', 'sun', 'mon', 'tue', 'wed', 'thu', 'fri'];

const COLORS = [
  'var(--pr)',
  '#7c3aed',
  '#0ea5e9',
  '#94a3b8',
];

const ROLES = [
  ['patient', 'adm_u_pt'],
  ['doctor', 'adm_u_dr'],
  ['lab', 'adm_u_lab'],
  ['reception', 'adm_u_rc'],
];

const SVC = {
  api: 'adm_svc_api',
  db: 'adm_svc_db',
  files: 'adm_svc_files',
};

const tipStyle = {
  background: 'var(--card)',
  border: '1px solid var(--bd)',
  borderRadius: 10,
  color: 'var(--tx)',
};

function formatUptime(seconds) {
  const value = Number(seconds) || 0;

  const days = Math.floor(value / 86400);
  const hours = Math.floor((value % 86400) / 3600);
  const minutes = Math.floor((value % 3600) / 60);
  const remainingSeconds = value % 60;

  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  if (minutes > 0) return `${minutes}m ${remainingSeconds}s`;

  return `${remainingSeconds}s`;
}

export default function Monitoring() {
  const { t, num } = useI18n();

  const state = useAsync(() => api.getMonitoring(), []);

  const [monitoring, setMonitoring] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [refreshError, setRefreshError] = useState(false);

  useEffect(() => {
    if (state?.data) {
      setMonitoring(state.data);
    }
  }, [state?.data]);

  useEffect(() => {
    const refresh = async () => {
      try {
        setRefreshing(true);

        const data = await api.getMonitoring();

        setMonitoring(data);
        setRefreshError(false);
      } catch (error) {
        console.error('Monitoring refresh error:', error);
        setRefreshError(true);
      } finally {
        setRefreshing(false);
      }
    };

    const interval = setInterval(refresh, 30000);

    return () => clearInterval(interval);
  }, []);

  const download = (m) => {
    const rows = [
      ['metric', 'value'],
      ['online', m.online],
      ['latency_ms', m.latency],
      ['errors', m.errors],
      ['uptime_seconds', m.uptime],
      ['booked', m.report?.booked ?? 'N/A'],
      ['access', m.report?.access ?? 'N/A'],
      ['uploaded', m.report?.uploaded ?? 0],
      ['newAccounts', m.report?.newAccounts ?? 0],
    ];

    const url = URL.createObjectURL(
      new Blob(
        [rows.map((r) => r.join(',')).join('\n')],
        { type: 'text/csv;charset=utf-8;' }
      )
    );

    const a = Object.assign(document.createElement('a'), {
      href: url,
      download: 'shefaa-monitoring-report.csv',
    });

    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <section>
      <h1>{t('adm_mon_title')}</h1>

      <p className="sub">{t('adm_mon_sub')}</p>

      <div className="note">
        <Icon name="info" size={18} />
        <span>{t('adm_mon_note')}</span>
      </div>

      <Async state={state}>
        {(initialData) => {
          const m = monitoring || initialData;

          const users = ROLES.map(([key, label]) => ({
            name: t(label),
            count: Number(m.usersByRole?.[key] || 0),
          }));

          const total = users.reduce(
            (sum, user) => sum + user.count,
            0
          );

          const weekly = (m.weekly || []).map((count, i) => ({
            day: t(`adm_d_${DAYS[i]}`),
            count,
          }));

          const stats = [
            {
              key: 'adm_mon_online',
              value: num(m.online ?? 0),
              subtitle: t('adm_mon_vs'),
              icon: 'users',
              tone: '',
            },
            {
              key: 'adm_mon_latency',
              value: `${num(m.latency ?? 0)} ms`,
              subtitle: 'Response time',
              icon: 'clock',
              tone: 'ok',
            },
            {
              key: 'adm_mon_errors',
              value: num(m.errors ?? 0),
              subtitle: 'Monitoring errors',
              icon: 'alert',
              tone: Number(m.errors) > 0 ? 'wn' : 'ok',
            },
            {
              key: 'adm_mon_uptime',
              value: formatUptime(m.uptime),
              subtitle: 'Server uptime',
              icon: 'activity',
              tone: 'ok',
            },
          ];

          return (
            <>
              <div
                className="sub"
                style={{
                  display: 'flex',
                  justifyContent: 'flex-end',
                  alignItems: 'center',
                  gap: 8,
                  marginBottom: 10,
                }}
              >
                <span>
                  {refreshing ? 'Updating...' : 'Auto refresh: 30 seconds'}
                </span>

                {refreshError && (
                  <span style={{ color: 'var(--danger, #dc2626)' }}>
                    Update failed
                  </span>
                )}
              </div>

              <div className="grid g4">
                {stats.map((stat) => (
                  <div className="card stat" key={stat.key}>
                    <div className={`tile ${stat.tone}`}>
                      <Icon name={stat.icon} size={22} />
                    </div>

                    <span>{t(stat.key)}</span>

                    <b>{stat.value}</b>

                    <small className="sub" style={{ margin: 0 }}>
                      {stat.subtitle}
                    </small>
                  </div>
                ))}
              </div>

              <div className="card" style={{ marginTop: 16 }}>
                <h2>{t('adm_mon_weekly')}</h2>

                <div className="chart-box">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                      data={weekly}
                      margin={{
                        top: 8,
                        right: 8,
                        left: 0,
                        bottom: 0,
                      }}
                    >
                      <defs>
                        <linearGradient
                          id="g"
                          x1="0"
                          y1="0"
                          x2="0"
                          y2="1"
                        >
                          <stop
                            offset="0%"
                            stopColor="var(--pr)"
                            stopOpacity=".35"
                          />

                          <stop
                            offset="100%"
                            stopColor="var(--pr)"
                            stopOpacity="0"
                          />
                        </linearGradient>
                      </defs>

                      <CartesianGrid
                        stroke="var(--bd)"
                        vertical={false}
                      />

                      <XAxis
                        dataKey="day"
                        tick={{
                          fill: 'var(--mu)',
                          fontSize: 12,
                        }}
                        axisLine={false}
                        tickLine={false}
                      />

                      <YAxis
                        tick={{
                          fill: 'var(--mu)',
                          fontSize: 12,
                        }}
                        axisLine={false}
                        tickLine={false}
                        width={40}
                      />

                      <Tooltip
                        contentStyle={tipStyle}
                        formatter={(value) => [
                          `${num(value)} ${t('adm_mon_requests')}`,
                          '',
                        ]}
                      />

                      <Area
                        type="monotone"
                        dataKey="count"
                        stroke="var(--pr)"
                        strokeWidth={2.5}
                        fill="url(#g)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="grid g3" style={{ marginTop: 16 }}>
                <div className="card">
                  <h2>{t('adm_mon_report')}</h2>

                  {[
                    ['adm_mon_booked', m.report?.booked ?? '—'],
                    ['adm_mon_access', m.report?.access ?? '—'],
                    ['adm_mon_uploaded', m.report?.uploaded ?? 0],
                    ['adm_mon_newacc', m.report?.newAccounts ?? 0],
                  ].map(([key, value]) => (
                    <div className="row" key={key}>
                      <span className="m">{t(key)}</span>

                      <b>
                        {typeof value === 'number' ? num(value) : value}
                      </b>
                    </div>
                  ))}

                  <div className="btn-row">
                    <button
                      type="button"
                      className="btn o"
                      onClick={() => download(m)}
                    >
                      <Icon name="download" size={16} />
                      {t('adm_mon_download')}
                    </button>
                  </div>
                </div>

                <div className="card">
                  <h2>{t('adm_mon_services')}</h2>

                  {(m.services || []).map((service) => (
                    <div className="svc" key={service.key}>
                      <span
                        className={`dot ${service.ok ? '' : 'bad'}`}
                      />

                      <div className="m">
                        {t(SVC[service.key] || service.key)}
                      </div>

                      <span
                        className={`badge ${service.ok ? 'ok' : 'wn'}`}
                      >
                        {service.ok
                          ? t('adm_svc_up')
                          : t('adm_svc_slow')}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="card">
                  <h2>{t('adm_mon_users_by')}</h2>

                  <div className="donut-wrap">
                    <div
                      style={{
                        position: 'relative',
                        width: 170,
                        height: 170,
                        direction: 'ltr',
                      }}
                    >
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={users}
                            dataKey="count"
                            nameKey="name"
                            innerRadius={55}
                            outerRadius={80}
                            paddingAngle={3}
                            stroke="none"
                          >
                            {users.map((user, index) => (
                              <Cell
                                key={user.name}
                                fill={COLORS[index]}
                              />
                            ))}
                          </Pie>

                          <Tooltip contentStyle={tipStyle} />
                        </PieChart>
                      </ResponsiveContainer>

                      <div
                        style={{
                          position: 'absolute',
                          inset: 0,
                          display: 'grid',
                          placeContent: 'center',
                          textAlign: 'center',
                          pointerEvents: 'none',
                        }}
                      >
                        <b style={{ fontSize: 22 }}>
                          {num(total)}
                        </b>

                        <small className="sub" style={{ margin: 0 }}>
                          {t('adm_mon_users_word')}
                        </small>
                      </div>
                    </div>

                    <div className="legend">
                      {users.map((user, index) => (
                        <span key={user.name}>
                          <i
                            style={{
                              background: COLORS[index],
                            }}
                          />

                          {user.name} <b>{num(user.count)}</b>
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </>
          );
        }}
      </Async>
    </section>
  );
}
