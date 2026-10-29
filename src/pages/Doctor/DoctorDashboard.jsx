import { useDoctor } from '../../context/DoctorContext.jsx';
import { appointments, patients } from '../../data/doctorData.js';
import TodayAppointments from '../../components/Doctor/TodayAppointments.jsx';

export default function DoctorDashboard() {
  const { t } = useDoctor();
  const stats = [
    [t('stat_today'), appointments.length],
    [t('stat_waiting'), appointments.filter((a) => a.status === 'wait').length],
    [t('stat_patients'), patients.length],
  ];
  return (
    <section>
      <h1>{t('greeting')}</h1>
      <p className="d-sub">{t('dash_sub')}</p>
      <div className="d-grid d-g3">
        {stats.map(([label, value]) => (
          <div className="d-card d-stat" key={label}>
            <span>{label}</span>
            <b>{value.toLocaleString('ar-EG')}</b>
          </div>
        ))}
      </div>
      <div style={{ marginTop: 14 }}>
        <TodayAppointments />
      </div>
    </section>
  );
}
