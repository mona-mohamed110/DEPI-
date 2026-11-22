import { useState } from 'react';
import Switch from '../../components/ui/Switch.jsx';
import ConfirmForm from '../../components/ui/ConfirmForm.jsx';
import { Async } from '../../components/ui/States.jsx';
import { useAsync } from '../../components/ui/hooks.js';
import { useToast } from '../../components/ui/Toast.jsx';
import { useI18n } from '../../context/I18nContext.jsx';
import { isEmail, isStrongPassword } from '../../api/security.js';
import PasswordInput from '../../components/auth/PasswordInput.jsx';
import * as api from '../../api/doctor.js';

export default function Team() {
  const { t, L } = useI18n();
  const { act, toast } = useToast();
  const state = useAsync(() => api.getTeam(), []);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState(null);
  const [busy, setBusy] = useState(false);

  const setPerm = async (m, j, v) => {
    const perms = m.perms.map((o, k) => (k === j ? v : o));
    state.setData((l) => l.map((x) => (x.id === m.id ? { ...x, perms } : x)));
    const r = await act(() => api.setStaffPerms(m.id, perms));
    if (!r) state.reload();
  };
  const add = async (e) => {
    e.preventDefault();
    if (name.trim().length < 2 || !isEmail(email)) return toast(t('enter_name_email'));
    if (!isStrongPassword(password)) return toast(t('staff_pass_rule'));
    setBusy(true);
    const m = await act(() => api.addStaff({ name, email, password }), 'staff_added');
    setBusy(false);
    if (m) { state.setData((l) => [...l, m]); setName(''); setEmail(''); setPassword(''); }
  };
  const remove = async (id) => {
    setBusy(true);
    const ok = await act(() => api.removeStaff(id), 'staff_removed');
    setBusy(false);
    if (ok) { state.setData((l) => l.filter((x) => x.id !== id)); setConfirm(null); }
  };

  return (
    <section>
      <h1>{t('team_title')}</h1>
      <p className="sub">{t('team_sub')}</p>
      <div className="grid g2">
        <div className="card">
          <h2>{t('team')}</h2>
          <Async state={state}>{(list) => list.length === 0 ? <div className="state">{t('no_results')}</div> : list.map((s) => (
            <div key={s.id} style={{ borderBottom: '1px solid var(--bd)', paddingBottom: 10, marginBottom: 6 }}>
              <div className="row" style={{ border: 0 }}>
                <div className="av">{L(s.name).charAt(0)}</div>
                <div className="m"><b>{L(s.name)}</b><small>{t('receptionist')} · <span dir="ltr">{s.email}</span></small></div>
                <button type="button" className="btn s o dg" onClick={() => setConfirm(s.id)}>{t('remove')}</button>
                {confirm === s.id && <ConfirmForm message={t('staff_del_q', { name: L(s.name) })} busy={busy} onConfirm={() => remove(s.id)} onCancel={() => setConfirm(null)} />}
              </div>
              {s.perms.map((v, j) => (
                <div className="row" key={j} style={{ padding: '6px 0' }}><span className="m">{t(`p${j}`)}</span><Switch on={v} onChange={(val) => setPerm(s, j, val)} label={t(`p${j}`)} /></div>
              ))}
              <div className="row" style={{ padding: '6px 0', border: 0 }}><span className="m">{t('p_locked')}</span><Switch on={false} disabled /></div>
            </div>
          ))}</Async>
        </div>
        <form className="card" onSubmit={add} noValidate>
          <h2>{t('add_staff')}</h2>
          <label className="first">{t('name_l')}</label>
          <input value={name} maxLength={80} onChange={(e) => setName(e.target.value)} />
          <label>{t('email')}</label>
          <input value={email} dir="ltr" type="email" onChange={(e) => setEmail(e.target.value)} />
          <label>{t('staff_password')}</label>
          <PasswordInput id="staff-pw" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="new-password" />
          <p className="sub" style={{ margin: '12px 0 0', fontSize: 13 }}>{t('staff_note')}</p>
          <div className="btn-row"><button type="submit" className="btn" disabled={busy}>{t('add_account')}</button></div>
        </form>
      </div>
    </section>
  );
}
