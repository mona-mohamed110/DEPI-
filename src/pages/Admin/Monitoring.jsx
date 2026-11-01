import {
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { useApp } from "../../context/AppContext.jsx";
import "../../components/Style/Admin/Monitoring.css";

function ChartTooltip(props) {
  if (!props.active || !props.payload || props.payload.length === 0) {
    return null;
  }
  return (
    <div className="chart-tooltip">
      <span>{props.label}</span>
      <b>{props.payload[0].value} {props.unit}</b>
    </div>
  );
}

function Monitoring() {
  const { t, lang } = useApp();

  const requests = [
    { day: t("adm_d_sat"), count: 820 },
    { day: t("adm_d_sun"), count: 910 },
    { day: t("adm_d_mon"), count: 880 },
    { day: t("adm_d_tue"), count: 1040 },
    { day: t("adm_d_wed"), count: 990 },
    { day: t("adm_d_thu"), count: 760 },
    { day: t("adm_d_fri"), count: 700 },
  ];

  const services = [
    { name: t("adm_svc_api"), ok: true },
    { name: t("adm_svc_db"), ok: true },
    { name: t("adm_svc_notif"), ok: true },
    { name: t("adm_svc_files"), ok: true },
    { name: t("adm_svc_ai"), ok: false },
  ];

  const users = [
    { name: t("adm_u_pt"), count: 4 },
    { name: t("adm_u_dr"), count: 3 },
    { name: t("adm_u_lab"), count: 2 },
    { name: t("adm_u_rc"), count: 1 },
  ];

  const colors = ["#2563eb", "#7c3aed", "#0ea5e9", "#94a3b8"];

  const totalUsers = users.reduce(function (sum, u) {
    return sum + u.count;
  }, 0);

  const isAr = lang === "ar";

  return (
    <div className="monitoring">
      <h1>{t("adm_mon_title")}</h1>
      <p className="monitoring-sub">{t("adm_mon_sub")}</p>

      <div className="monitoring-note">{t("adm_mon_note")}</div>

      <div className="monitoring-stats">
        <div className="monitoring-card">
          <span>{t("adm_mon_online")}</span>
          <b>248</b>
          <small>{t("adm_mon_vs")}</small>
        </div>
        <div className="monitoring-card">
          <span>{t("adm_mon_latency")}</span>
          <b>180ms</b>
          <small>{t("adm_mon_excellent")}</small>
        </div>
        <div className="monitoring-card">
          <span>{t("adm_mon_errors")}</span>
          <b>0.3%</b>
          <small>{t("adm_mon_stable")}</small>
        </div>
        <div className="monitoring-card">
          <span>{t("adm_mon_uptime")}</span>
          <b>99.9%</b>
          <small>{t("adm_mon_30d")}</small>
        </div>
      </div>

      <div className="monitoring-grid">
        <div className="monitoring-card">
          <h2>{t("adm_mon_report")}</h2>
          <div className="monitoring-row">
            <div className="monitoring-name">{t("adm_mon_booked")}</div>
            <b>3,420</b>
          </div>
          <div className="monitoring-row">
            <div className="monitoring-name">{t("adm_mon_access")}</div>
            <b>1,890</b>
          </div>
          <div className="monitoring-row">
            <div className="monitoring-name">{t("adm_mon_uploaded")}</div>
            <b>2,710</b>
          </div>
          <div className="monitoring-row">
            <div className="monitoring-name">{t("adm_mon_newacc")}</div>
            <b>312</b>
          </div>
          <button className="monitoring-btn">{t("adm_mon_download")}</button>
        </div>

        <div className="monitoring-card">
          <h2>{t("adm_mon_services")}</h2>
          {services.map(function (s, i) {
            return (
              <div className="monitoring-row" key={i}>
                <span className={s.ok ? "monitoring-dot" : "monitoring-dot warn"}></span>
                <div className="monitoring-name">{s.name}</div>
                <span className={s.ok ? "monitoring-badge ok" : "monitoring-badge warn"}>
                  {s.ok ? t("adm_svc_up") : t("adm_svc_slow")}
                </span>
              </div>
            );
          })}
        </div>

        <div className="monitoring-card monitoring-users">
          <h2>{t("adm_mon_users_by")}</h2>

          <div className="monitoring-donut" dir="ltr">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={users}
                  dataKey="count"
                  nameKey="name"
                  innerRadius={55}
                  outerRadius={80}
                  paddingAngle={3}
                >
                  {users.map(function (u, i) {
                    return <Cell key={i} fill={colors[i]} />;
                  })}
                </Pie>
                <Tooltip
                  contentStyle={{
                    background: "#0f1b2d",
                    border: "none",
                    borderRadius: "10px",
                    color: "#fff",
                  }}
                  itemStyle={{ color: "#fff" }}
                />
              </PieChart>
            </ResponsiveContainer>

            <div className="monitoring-donut-center">
              <b>{totalUsers}</b>
              <span>{t("adm_mon_users_word")}</span>
            </div>
          </div>

          {users.map(function (u, i) {
            return (
              <div className="monitoring-row" key={i}>
                <span className="monitoring-legend-dot" style={{ background: colors[i] }}></span>
                <div className="monitoring-name">{u.name}</div>
                <b>{u.count}</b>
              </div>
            );
          })}
        </div>
      </div>

      <div className="monitoring-card monitoring-wide">
        <h2>{t("adm_mon_weekly")}</h2>
        <div className="monitoring-chart" dir="ltr">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={requests} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="requestsFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#2563eb" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="#2563eb" stopOpacity={0} />
                </linearGradient>
              </defs>

              <CartesianGrid vertical={false} stroke="var(--border)" />
              <XAxis
                dataKey="day"
                reversed={isAr}
                axisLine={false}
                tickLine={false}
                tick={{ fill: "var(--muted)", fontSize: 13 }}
              />
              <YAxis
                orientation={isAr ? "right" : "left"}
                axisLine={false}
                tickLine={false}
                tick={{ fill: "var(--muted)", fontSize: 12 }}
                width={40}
              />
              <Tooltip
                content={<ChartTooltip unit={t("adm_mon_requests")} />}
                cursor={{ stroke: "#2563eb", strokeDasharray: "4 4" }}
              />
              <Area
                type="monotone"
                dataKey="count"
                stroke="#2563eb"
                strokeWidth={3}
                fill="url(#requestsFill)"
                dot={{ r: 4, fill: "#fff", stroke: "#2563eb", strokeWidth: 2 }}
                activeDot={{ r: 7, fill: "#2563eb", stroke: "#fff", strokeWidth: 3 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

export default Monitoring;