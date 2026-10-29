import { useState } from 'react';
import { useDoctor } from '../../context/DoctorContext.jsx';
import Switch from '../../components/Doctor/Switch.jsx';

export default function Team() {
  const { t, toast } = useDoctor();
  const [staff, setStaff] = useState([{ id: 1, n: 'سلمى أحمد', p: [true, true, true] }]);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');

  const setPerm = (id, j, v) =>
    setStaff((s) => s.map((x) => (x.id === id ? { ...x, p: x.p.map((o, k) => (k === j ? v : o)) } : x)));

  const add = () => {
    if (!name.trim() || !email.trim()) return toast(t('enter_name_email'));
    setStaff((s) => [...s, { id: Date.now(), n: name.trim(), p: [true, true, true] }]);
    setName('');
    setEmail('');
    toast(t('staff_added'));
  };

  return (
    <section>
      <h1>{t('team_title')}</h1>
      <p className="d-sub">{t('team_sub')}</p>
      <div className="d-grid d-g2">
        <div className="d-card">
          <h2>{t('team')}</h2>
          {staff.map((s) => (
            <div key={s.id} className="d-staff">
              <div className="d-row" style={{ border: 0 }}>
                <div className="d-av">{s.n.charAt(0)}</div>
                <div className="d-m"><b>{s.n}</b><small>{t('receptionist')}</small></div>
                <button
                  className="d-btn dg s"
                  onClick={() => {
                    setStaff((x) => x.filter((y) => y.id !== s.id));
                    toast(t('staff_removed'));
                  }}
                >
                  {t('remove')}
                </button>
              </div>
              {s.p.map((v, j) => (
                <div className="d-row d-perm" key={j}>
                  <span className="d-m">{t(`p${j}`)}</span>
                  <Switch on={v} onChange={(val) => setPerm(s.id, j, val)} label={t(`p${j}`)} />
                </div>
              ))}
              <div className="d-row d-perm">
                <span className="d-m">{t('p_locked')}</span>
                <Switch on={false} disabled />
              </div>
            </div>
          ))}
        </div>

        <div className="d-card">
          <h2>{t('add_staff')}</h2>
          <label className="first">{t('name_l')}</label>
          <input value={name} onChange={(e) => setName(e.target.value)} />
          <label>{t('email')}</label>
          <input value={email} onChange={(e) => setEmail(e.target.value)} dir="ltr" />
          <br /><br />
          <button className="d-btn" onClick={add}>{t('add_account')}</button>
        </div>
      </div>
    </section>
  );
}
