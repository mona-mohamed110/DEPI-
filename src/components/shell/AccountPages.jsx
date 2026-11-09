// صفحتا الملف الشخصي وإعدادات الحساب — مشتركتين بين كل الأدوار (نفس الشكل، كل جزء بالـ CSS الخاص بيه)
import { useState } from 'react';
import { useI18n } from '../../context/I18nContext.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { useToast } from '../ui/Toast.jsx';
import { useAsync } from '../ui/hooks.js';
import { Async } from '../ui/States.jsx';
import Switch from '../ui/Switch.jsx';
import * as shared from '../../api/shared.js';
import * as authApi from '../../api/auth.js';
import { isEmail, isStrongPassword } from '../../api/security.js';

const NOTIF_LABEL = { notifEmail: 'n_email', notifAppt: 'n_appts', notifMeds: 'n_meds', notifAccess: 'n_access', notifNew: 'n_new' };

// كارت البيانات الشخصية (الاسم، الإيميل، الهاتف) — بيتستخدم في صفحة الملف الشخصي لكل الأدوار
export function PersonalCard({ className = 'card' }) {
  const { t, L } = useI18n();
  const { updateUser } = useAuth();
  const { act } = useToast();
  const state = useAsync(() => shared.getMe(), []);
  const [form, setForm] = useState(null);
  const [err, setErr] = useState({});

  const startEdit = (me) => { setErr({}); setForm({ name: L(me.name), email: me.email, phone: me.phone || '' }); };
  const save = async (e) => {
    e.preventDefault();
    const er = {};
    if (form.name.trim().length < 2) er.name = true;
    if (!isEmail(form.email)) er.email = true;
    setErr(er);
    if (Object.keys(er).length) return;
    const me = await act(() => shared.updateMe(form), 'saved');
    if (me) { state.setData(me); updateUser({ name: me.name, email: me.email, phone: me.phone }); setForm(null); }
  };

  return (
    <div className={className}>
      <Async state={state}>{(me) => (
        <>
          <div className="profile-head">
            <div className="avatar">{L(me.name).charAt(0)}</div>
            <div><b>{L(me.name)}</b><span className="badge">{t(`role_${me.role}`)}</span></div>
          </div>
          {form ? (
            <form onSubmit={save} noValidate>
              <label className="first">{t('pf_name')}</label>
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} autoComplete="name" />
              {err.name && <div className="err">{t('err_invalid_data')}</div>}
              <label>{t('pf_email')}</label>
              <input dir="ltr" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} autoComplete="email" />
              {err.email && <div className="err">{t('err_invalid_data')}</div>}
              <label>{t('pf_phone')}</label>
              <input dir="ltr" inputMode="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} autoComplete="tel" />
              <div className="btn-row">
                <button type="submit" className="btn">{t('save')}</button>
                <button type="button" className="btn o" onClick={() => setForm(null)}>{t('cancel')}</button>
              </div>
            </form>
          ) : (
            <>
              <div className="row"><span className="m">{t('pf_name')}</span><b>{L(me.name)}</b></div>
              <div className="row"><span className="m">{t('pf_email')}</span><b dir="ltr">{me.email}</b></div>
              <div className="row"><span className="m">{t('pf_phone')}</span><b dir="ltr">{me.phone || '—'}</b></div>
              <div className="row"><span className="m">{t('pf_role')}</span><b>{t(`role_${me.role}`)}</b></div>
              <div className="btn-row"><button type="button" className="btn" onClick={() => startEdit(me)}>{t('edit')}</button></div>
            </>
          )}
        </>
      )}</Async>
    </div>
  );
}

export function ProfilePage({ title }) {
  const { t } = useI18n();
  return (
    <section>
      <h1>{title || t('profile')}</h1>
      <p className="sub">{t('pf_sub')}</p>
      <PersonalCard className="card narrow" />
    </section>
  );
}

// notifs: مفاتيح الإشعارات اللي بتظهر للدور ده
export function AccountPage({ notifs = ['notifEmail'] }) {
  const { t } = useI18n();
  const { act } = useToast();
  const state = useAsync(() => shared.getMe(), []);
  const [f, setF] = useState({ cur: '', next: '', conf: '' });
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  const setPref = async (key, val) => {
    state.setData((m) => ({ ...m, [key]: val }));
    const r = await act(() => shared.updateMe({ [key]: val }));
    if (!r) state.reload();
  };
  const changePass = async (e) => {
    e.preventDefault();
    if (!f.cur) return setErr(t('cur_pass'));
    if (!isStrongPassword(f.next)) return setErr(t('pass_rule'));
    if (f.next !== f.conf) return setErr(t('pass_mismatch'));
    setErr(''); setBusy(true);
    const r = await act(() => authApi.changePassword(f.cur, f.next), 'pass_changed');
    setBusy(false);
    if (r) setF({ cur: '', next: '', conf: '' });
  };
  const logoutAll = () => act(() => shared.logoutAll(), 'logout_all_done');

  return (
    <section>
      <h1>{t('accountSettings')}</h1>
      <p className="sub">{t('acc_sub')}</p>
      <div className="grid g2">
        <form className="card" onSubmit={changePass} noValidate>
          <h2>{t('change_password')}</h2>
          <label className="first">{t('cur_pass')}</label>
          <input type="password" dir="ltr" autoComplete="current-password" value={f.cur} onChange={(e) => setF({ ...f, cur: e.target.value })} />
          <label>{t('new_pass')}</label>
          <input type="password" dir="ltr" autoComplete="new-password" value={f.next} onChange={(e) => setF({ ...f, next: e.target.value })} />
          <label>{t('confirm_pass')}</label>
          <input type="password" dir="ltr" autoComplete="new-password" value={f.conf} onChange={(e) => setF({ ...f, conf: e.target.value })} />
          {err && <div className="err">{err}</div>}
          <div className="btn-row"><button type="submit" className="btn" disabled={busy}>{busy ? t('loading') : t('change_password')}</button></div>
        </form>

        <Async state={state}>{(me) => (
          <div>
            <div className="card">
              <h2>{t('acc_notif')}</h2>
              {notifs.map((k) => (
                <div className="row" key={k}><div className="m">{t(NOTIF_LABEL[k])}</div><Switch on={!!me[k]} onChange={(v) => setPref(k, v)} label={t(NOTIF_LABEL[k])} /></div>
              ))}
            </div>
            <div className="card" style={{ marginTop: 16 }}>
              <h2>{t('acc_security')}</h2>
              <div className="row"><div className="m">{t('two_factor')}</div><Switch on={!!me.twoFactor} onChange={(v) => setPref('twoFactor', v)} label={t('two_factor')} /></div>
              <div className="row"><div className="m">{t('logout_all')}</div><button type="button" className="btn o s" onClick={logoutAll}>{t('run')}</button></div>
            </div>
          </div>
        )}</Async>
      </div>
    </section>
  );
}
