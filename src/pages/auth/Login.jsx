import { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import AuthPage from '../../components/auth/AuthPage.jsx';
import PasswordInput from '../../components/auth/PasswordInput.jsx';
import Icon from '../../components/Icon.jsx';
import { useI18n } from '../../context/I18nContext.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { ROLE_HOME, USE_MOCK } from '../../config/env.js';
import { isEmail } from '../../api/security.js';

const DEMO = [['patient', 'patient@shefaa.com', 'Patient@123'], ['doctor', 'doctor@shefaa.com', 'Doctor@123'], ['lab', 'lab@shefaa.com', 'Lab@12345'], ['reception', 'reception@shefaa.com', 'Reception@123'], ['admin', 'admin@shefaa.com', 'Admin@123']];
const ICON = { patient: 'user', doctor: 'stethoscope', lab: 'flask', reception: 'inbox', admin: 'shield' };

function Form() {
  const { t } = useI18n();
  const { user, login, verifyLogin } = useAuth();
  const nav = useNavigate();
  const loc = useLocation();
  const [email, setEmail] = useState(loc.state?.email || '');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [step, setStep] = useState('login'); // login | code
  const [code, setCode] = useState('');

  // لو مسجل دخول بالفعل يروح للوحته
  if (user) return <Navigate to={ROLE_HOME[user.role]} replace />;

  const go = (u) => {
    const from = loc.state?.from;
    nav(from && from.startsWith(ROLE_HOME[u.role]) ? from : ROLE_HOME[u.role], { replace: true });
  };
  const submit = async (e) => {
    e.preventDefault();
    if (!isEmail(email) || !password) return setError(t('lg_need'));
    setError(''); setBusy(true);
    try {
      const r = await login(email, password);
      if (r.twoFactorRequired) { setStep('code'); setCode(''); setBusy(false); return; }
      go(r);
    }
    catch (err) {
      const msg = err.code === 'locked' ? t('lg_locked', { n: err.wait }) : t(`err_${err.code}`) !== `err_${err.code}` ? t(`err_${err.code}`) : t('error');
      setError(msg); setBusy(false);
    }
  };

  const submitCode = async (e) => {
    e.preventDefault();
    if (!/^\d{6}$/.test(code.trim())) return setError(t('err_invalid_code'));
    setError(''); setBusy(true);
    try { go(await verifyLogin(email, code)); }
    catch (err) {
      setError(t(`err_${err.code}`) !== `err_${err.code}` ? t(`err_${err.code}`) : t('error'));
      setBusy(false);
    }
  };
  const resend = async () => {
    setError(''); setBusy(true);
    try { await login(email, password); } catch { setError(t('error')); }
    setBusy(false);
  };

  if (step === 'code') {
    return (
      <>
        <h1>{t('tf_title')}</h1>
        <p className="auth-sub">{t('tf_sub')} <b dir="ltr">{email}</b></p>
        <form onSubmit={submitCode} noValidate>
          <label htmlFor="tf-code">{t('tf_code')}</label>
          <input id="tf-code" dir="ltr" inputMode="numeric" autoComplete="one-time-code" maxLength={6} value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))} />
          {error && <div className="err" role="alert">{error}</div>}
          <button type="submit" className="btn lg wide" disabled={busy}>{busy ? t('lg_ing') : t('tf_verify')}</button>
        </form>
        <p className="auth-foot">
          <button type="button" className="link" onClick={resend} disabled={busy}>{t('tf_resend')}</button>
          {' · '}
          <button type="button" className="link" onClick={() => { setStep('login'); setError(''); setPassword(''); }}>{t('tf_back')}</button>
        </p>
      </>
    );
  }

  return (
    <>
      <h1>{t('lg_title')}</h1>
      <p className="auth-sub">{t('lg_sub')}</p>
      {loc.state?.registered && <div className="ok-msg">{loc.state.registered === 'pending' ? t('lg_registered_pending') : t('lg_registered')}</div>}
      <form onSubmit={submit} noValidate>
        <label htmlFor="lg-email">{t('lg_email')}</label>
        <input id="lg-email" type="email" dir="ltr" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} maxLength={254} />
        <label htmlFor="lg-pass">{t('lg_pass')}</label>
        <PasswordInput id="lg-pass" value={password} onChange={(e) => setPassword(e.target.value)} />
        <div className="auth-row"><Link to="/forgot-password" className="link">{t('lg_forgot')}</Link></div>
        {error && <div className="err" role="alert">{error}</div>}
        <button type="submit" className="btn lg wide" disabled={busy}>{busy ? t('lg_ing') : t('lg_btn')}</button>
      </form>
      <p className="auth-foot">{t('lg_no_acc')} <Link to="/register" className="link">{t('lg_reg')}</Link></p>

      {USE_MOCK && (
        <div className="demo">
          <b>{t('lg_demo')}</b><small>{t('lg_demo_hint')}</small>
          <div className="demo-list">
            {DEMO.map(([role, mail, pass]) => (
              <button type="button" key={role} className="chip" onClick={() => { setEmail(mail); setPassword(pass); setError(''); }}><Icon name={ICON[role]} size={14} />{t(`role_${role}`)}</button>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
export default function Login() { return <AuthPage><Form /></AuthPage>; }
