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
  const { user, login } = useAuth();
  const nav = useNavigate();
  const loc = useLocation();
  const [email, setEmail] = useState(loc.state?.email || '');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

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
    try { go(await login(email, password)); }
    catch (err) {
      const msg = err.code === 'locked' ? t('lg_locked', { n: err.wait }) : t(`err_${err.code}`) !== `err_${err.code}` ? t(`err_${err.code}`) : t('error');
      setError(msg); setBusy(false);
    }
  };

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
