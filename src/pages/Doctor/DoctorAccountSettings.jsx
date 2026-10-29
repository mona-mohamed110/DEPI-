import { useState } from 'react';
import { useDoctor } from '../../context/DoctorContext.jsx';
import Switch from '../../components/Doctor/Switch.jsx';

export default function DoctorAccountSettings() {
  const { t, toast } = useDoctor();
  const [name, setName] = useState(() => t('doctor_name'));
  const [email, setEmail] = useState('doctor@example.com');

  return (
    <section>
      <h1>{t('account_settings')}</h1>
      <p className="d-sub">{t('account_sub')}</p>
      <div className="d-grid d-g2">
        <div className="d-card">
          <h2>{t('account')}</h2>
          <label className="first">{t('name_l')}</label>
          <input value={name} onChange={(e) => setName(e.target.value)} />
          <label>{t('email')}</label>
          <input value={email} onChange={(e) => setEmail(e.target.value)} dir="ltr" />
          <br /><br />
          <button className="d-btn" onClick={() => toast(t('saved'))}>{t('save')}</button>
        </div>

        <div className="d-card">
          <h2>{t('security')}</h2>
          <div className="d-row"><div className="d-m">{t('two_factor')}</div><Switch defaultOn /></div>
          <div className="d-row"><div className="d-m">{t('logout_all')}</div><button className="d-btn o s">{t('run')}</button></div>
          <div className="d-row"><div className="d-m">{t('change_password')}</div><button className="d-btn o s">{t('change')}</button></div>
        </div>

        <div className="d-card">
          <h2>{t('notifications')}</h2>
          <div className="d-row"><div className="d-m">{t('n_appts')}</div><Switch defaultOn /></div>
          <div className="d-row"><div className="d-m">{t('n_access')}</div><Switch defaultOn /></div>
          <div className="d-row"><div className="d-m">{t('n_sms')}</div><Switch /></div>
        </div>
      </div>
    </section>
  );
}
