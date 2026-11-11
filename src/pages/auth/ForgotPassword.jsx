import { useState } from 'react';
import { Link } from 'react-router-dom';
import AuthPage from '../../components/auth/AuthPage.jsx';
import PasswordInput from '../../components/auth/PasswordInput.jsx';
import Icon from '../../components/Icon.jsx';
import { useI18n } from '../../context/I18nContext.jsx';
import { USE_MOCK } from '../../config/env.js';
import { isEmail, isStrongPassword } from '../../api/security.js';
import * as auth from '../../api/auth.js';

// خطوات: email → code → password → done  (الكود بيتبعت على البريد الإلكتروني)
function Flow() {
  const { t } = useI18n();
  const [step, setStep] = useState('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [token, setToken] = useState('');
  const [pw, setPw] = useState('');
  const [pw2, setPw2] = useState('');
  const [dev, setDev] = useState('');
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const fail = (e) => setError(t(`err_${e.code}`) !== `err_${e.code}` ? t(`err_${e.code}`) : t('error'));
  const run = async (fn) => { setBusy(true); setError(''); setMsg(''); try { await fn(); } catch (e) { fail(e); } finally { setBusy(false); } };

  const sendCode = (resend = false) => run(async () => {
    if (!isEmail(email)) { setError(t('rg_err_email')); return; }
    const r = await auth.forgotPassword(email);
    if (USE_MOCK && r?.devCode) setDev(r.devCode);
    if (resend) setMsg(t('fp_resent')); else setStep('code');
  });
  const verify = () => run(async () => {
    if (!/^\d{6}$/.test(code)) { setError(t('err_invalid_code')); return; }
    const r = await auth.verifyCode(email, code);
    setToken(r.resetToken); setStep('password');
  });
  const save = () => run(async () => {
    if (!isStrongPassword(pw)) { setError(t('rg_err_pass')); return; }
    if (pw !== pw2) { setError(t('rg_err_match')); return; }
    await auth.resetPassword(email, token, pw); setStep('done');
  });
  const submit = (fn) => (e) => { e.preventDefault(); fn(); };

  if (step === 'done') return (
    <div className="center-col"><span className="big-ic ok"><Icon name="checkc" size={44} /></span><h1>{t('fp_done_title')}</h1><p className="auth-sub">{t('fp_done_sub')}</p><Link to="/login" className="btn lg wide">{t('fp_back')}</Link></div>
  );
  return (
    <>
      {step === 'email' && (
        <form onSubmit={submit(() => sendCode(false))} noValidate>
          <h1>{t('fp_title')}</h1><p className="auth-sub">{t('fp_sub')}</p>
          <label htmlFor="fp-email">{t('lg_email')}</label>
          <input id="fp-email" type="email" dir="ltr" autoComplete="email" value={email} maxLength={254} onChange={(e) => setEmail(e.target.value)} />
          {error && <div className="err" role="alert">{error}</div>}
          <button type="submit" className="btn lg wide" disabled={busy}>{busy ? t('fp_sending') : t('fp_send')}</button>
        </form>
      )}
      {step === 'code' && (
        <form onSubmit={submit(verify)} noValidate>
          <h1>{t('fp_code_title')}</h1><p className="auth-sub">{t('fp_code_sub', { email })}</p>
          <input className="code-input" dir="ltr" inputMode="numeric" autoComplete="one-time-code" maxLength={6} value={code} placeholder={t('fp_code_ph')} onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))} aria-label={t('fp_code_title')} />
          {dev && <div className="note-line"><Icon name="info" size={16} />{t('fp_dev', { code: dev })}</div>}
          {msg && <div className="ok-msg">{msg}</div>}
          {error && <div className="err" role="alert">{error}</div>}
          <button type="submit" className="btn lg wide" disabled={busy}>{t('fp_verify')}</button>
          <button type="button" className="link-btn center-link" disabled={busy} onClick={() => sendCode(true)}>{t('fp_resend')}</button>
        </form>
      )}
      {step === 'password' && (
        <form onSubmit={submit(save)} noValidate>
          <h1>{t('fp_new_title')}</h1><p className="auth-sub">{t('fp_new_sub')}</p>
          <label htmlFor="fp-pw">{t('rg_pass')}</label><PasswordInput id="fp-pw" value={pw} onChange={(e) => setPw(e.target.value)} autoComplete="new-password" />
          <label htmlFor="fp-pw2">{t('rg_confirm')}</label><PasswordInput id="fp-pw2" value={pw2} onChange={(e) => setPw2(e.target.value)} autoComplete="new-password" />
          {error && <div className="err" role="alert">{error}</div>}
          <button type="submit" className="btn lg wide" disabled={busy}>{t('fp_save')}</button>
        </form>
      )}
      <p className="auth-foot"><Link to="/login" className="link">{t('fp_back')}</Link></p>
    </>
  );
}
export default function ForgotPassword() { return <AuthPage><Flow /></AuthPage>; }
