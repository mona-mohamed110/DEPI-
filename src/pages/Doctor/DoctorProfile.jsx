import { useDoctor } from '../../context/DoctorContext.jsx';

export default function DoctorProfile() {
  const { t } = useDoctor();
  const rows = [
    ['name', t('doctor_name')],
    ['email', 'doctor@example.com'],
    ['phone', '01000000000'],
    ['role', t('role_v')],
  ];
  return (
    <section>
      <h1>{t('profile')}</h1>
      <p className="d-sub">{t('profile_sub')}</p>
      <div className="d-card" style={{ maxWidth: 560 }}>
        <div className="d-profile-head">
          <div className="d-av big">أ</div>
          <b>{t('doctor_name')}</b>
        </div>
        {rows.map(([k, v]) => (
          <div className="d-row" key={k}>
            <span className="d-m">{t(k)}</span>
            <b dir={k === 'email' || k === 'phone' ? 'ltr' : undefined}>{v}</b>
          </div>
        ))}
      </div>
    </section>
  );
}
