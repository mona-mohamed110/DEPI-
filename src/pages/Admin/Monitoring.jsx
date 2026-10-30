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
import "../../components/Style/Admin/Monitoring.css";

function ChartTooltip(props) {
  if (!props.active || !props.payload || props.payload.length === 0) {
    return null;
  }
  return (
    <div className="chart-tooltip" dir="rtl">
      <span>{props.label}</span>
      <b>{props.payload[0].value} طلب</b>
    </div>
  );
}

function Monitoring() {
  const requests = [
    { day: "سبت", count: 820 },
    { day: "أحد", count: 910 },
    { day: "إثنين", count: 880 },
    { day: "ثلاثاء", count: 1040 },
    { day: "أربعاء", count: 990 },
    { day: "خميس", count: 760 },
    { day: "جمعة", count: 700 },
  ];

  const services = [
    { name: "واجهة التطبيق (API)", ok: true },
    { name: "قاعدة البيانات", ok: true },
    { name: "الإشعارات والرسائل", ok: true },
    { name: "تخزين الملفات", ok: true },
    { name: "شات بوت الذكاء الاصطناعي", ok: false },
  ];

  const users = [
    { name: "مرضى", count: 4 },
    { name: "أطباء", count: 3 },
    { name: "معامل", count: 2 },
    { name: "استقبال", count: 1 },
  ];

const colors = ["#2563eb", "#7c3aed", "#0ea5e9", "#94a3b8"];

const totalUsers = users.reduce(function (sum, u) {
  return sum + u.count;
}, 0);

  return (
    <div className="monitoring" dir="rtl">
      <h1>أداء النظام والتقارير العامة</h1>
      <p className="monitoring-sub">إحصائيات عامة فقط</p>

      <div className="monitoring-note">
        🔒 لوحة المدير بتعرض أرقام وإحصائيات عامة بس، ومفيهاش أي بيانات طبية أو أسماء مرضى.
      </div>

      <div className="monitoring-stats">
        <div className="monitoring-card">
          <span>مستخدمين الآن</span>
          <b>248</b>
          <small>▲ 12٪ عن أمس</small>
        </div>
        <div className="monitoring-card">
          <span>زمن الاستجابة</span>
          <b>180ms</b>
          <small>ممتاز</small>
        </div>
        <div className="monitoring-card">
          <span>نسبة الأخطاء</span>
          <b>0.3٪</b>
          <small>مستقرة</small>
        </div>
        <div className="monitoring-card">
          <span>مدة التشغيل</span>
          <b>99.9٪</b>
          <small>آخر 30 يوم</small>
        </div>
      </div>

      <div className="monitoring-grid">
        <div className="monitoring-card">
          <h2>تقرير الشهر (أرقام عامة)</h2>
          <div className="monitoring-row">
            <div className="monitoring-name">مواعيد تم حجزها</div>
            <b>3,420</b>
          </div>
          <div className="monitoring-row">
            <div className="monitoring-name">طلبات إذن وصول</div>
            <b>1,890</b>
          </div>
          <div className="monitoring-row">
            <div className="monitoring-name">نتائج تم رفعها</div>
            <b>2,710</b>
          </div>
          <div className="monitoring-row">
            <div className="monitoring-name">حسابات جديدة</div>
            <b>312</b>
          </div>
          <button className="monitoring-btn">⬇️ تحميل التقرير</button>
        </div>

        <div className="monitoring-card">
          <h2>حالة الخدمات</h2>
          {services.map(function (s, i) {
            return (
              <div className="monitoring-row" key={i}>
                <span className={s.ok ? "monitoring-dot" : "monitoring-dot warn"}></span>
                <div className="monitoring-name">{s.name}</div>
                <span className={s.ok ? "monitoring-badge ok" : "monitoring-badge warn"}>
                  {s.ok ? "يعمل" : "بطيء قليلاً"}
                </span>
              </div>
            );
          })}
        </div>

<div className="monitoring-card monitoring-users">
  <h2>المستخدمين حسب النوع</h2>

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
        <Tooltip />
      </PieChart>
    </ResponsiveContainer>

    <div className="monitoring-donut-center">
      <b>{totalUsers}</b>
      <span>مستخدم</span>
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
  <h2>عدد الطلبات خلال الأسبوع</h2>
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
          reversed
          axisLine={false}
          tickLine={false}
          tick={{ fill: "var(--muted)", fontSize: 13 }}
        />
        <YAxis
          orientation="right"
          axisLine={false}
          tickLine={false}
          tick={{ fill: "var(--muted)", fontSize: 12 }}
          width={40}
        />
<Tooltip content={<ChartTooltip />} cursor={{ stroke: "#2563eb", strokeDasharray: "4 4" }} />
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