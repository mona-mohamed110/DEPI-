import { useState } from 'react';
import { useApp } from '../../context/AppContext.jsx';

function Switch({ defaultOn = false }) {
  const [on, setOn] = useState(defaultOn);
  return <button className={`switch ${on ? 'on' : ''}`} role="switch" aria-checked={on} onClick={() => setOn((v) => !v)} />;
}

export default function AccountSettings() {
  const { t, toast } = useApp();
  const [name, setName] = useState(() => t('full_name'));
  const [email, setEmail] = useState('mona@example.com');

  return (
    <section>
      <h1>{t('account_settings')}</h1>
      <p className="sub">{t('account_sub')}</p>
      <div className="grid g2">
        <div className="card">
          <h2>{t('account')}</h2>
          <label>{t('name')}</label>
          <input value={name} onChange={(e) => setName(e.target.value)} />
          <div className="gap" />
          <label>{t('email')}</label>
          <input value={email} onChange={(e) => setEmail(e.target.value)} dir="ltr" />
          <div className="gap" />
          <button className="btn" onClick={() => toast(t('saved'))}>{t('save')}</button>
        </div>

        <div className="card">
          <h2>{t('security')}</h2>
          <div className="row"><div className="m">{t('two_factor')}</div><Switch defaultOn /></div>
          <div className="row"><div className="m">{t('logout_all')}</div><button className="btn o s">{t('run')}</button></div>
          <div className="row"><div className="m">{t('change_password')}</div><button className="btn o s">{t('change')}</button></div>
        </div>

        <div className="card">
          <h2>{t('notifications')}</h2>
          <div className="row"><div className="m">{t('n_appts')}</div><Switch defaultOn /></div>
          <div className="row"><div className="m">{t('n_meds')}</div><Switch defaultOn /></div>
          <div className="row"><div className="m">{t('n_access')}</div><Switch defaultOn /></div>
          <div className="row"><div className="m">{t('n_sms')}</div><Switch /></div>
        </div>
      </div>
    </section>
  );
}
