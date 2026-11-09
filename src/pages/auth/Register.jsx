import { useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AuthPage from '../../components/auth/AuthPage.jsx';
import PasswordInput from '../../components/auth/PasswordInput.jsx';
import Icon from '../../components/Icon.jsx';
import { useI18n } from '../../context/I18nContext.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { checkFile, isEgPhone, isEmail, isStrongPassword } from '../../api/security.js';
import { BLOOD_TYPES, CHRONIC } from '../../config/catalog.js';

const ROLES = [['patient', 'user', 'rg_patient'], ['doctor', 'stethoscope', 'rg_doctor'], ['lab', 'flask', 'rg_lab']];
const SPECS = ['sp_internal', 'sp_cardio', 'sp_neuro', 'sp_peds', 'sp_derm', 'sp_ortho'];
const digits = (s) => String(s).replace(/[٠-٩]/g, (d) => '٠١٢٣٤٥٦٧٨٩'.indexOf(d));

function Form() {
  const { t, lang } = useI18n();
  const { register } = useAuth();
  const certInput = useRef(null);
  const nav = useNavigate();
  const [role, setRole] = useState('patient');
  const [f, setF] = useState({ fullName: '', labName: '', email: '', phone: '', password: '', confirm: '', specialty: 'sp_internal', license: '', terms: false, birthDate: '', blood: '', height: '', weight: '' });
  const [chronicIds, setChronicIds] = useState([]);
  const [cert, setCert] = useState(null);
  const [err, setErr] = useState({});
  const [apiErr, setApiErr] = useState('');
  const [busy, setBusy] = useState(false);
  const toggleChronic = (id) => setChronicIds((c) => (c.includes(id) ? c.filter((x) => x !== id) : [...c, id]));
  const set = (k) => (e) => setF((x) => ({ ...x, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    const er = {};
    if (f.fullName.trim().length < 3) er.fullName = t('rg_err_name');
    if (role === 'lab' && f.labName.trim().length < 3) er.labName = t('rg_err_name');
    if (!isEmail(f.email)) er.email = t('rg_err_email');
    if (!isEgPhone(digits(f.phone))) er.phone = t('rg_err_phone');
    if (!isStrongPassword(f.password)) er.password = t('rg_err_pass');
    else if (f.password !== f.confirm) er.confirm = t('rg_err_match');
    if (role !== 'patient' && f.license.trim().length < 4) er.license = t('rg_err_license');
    if (role === 'patient') {
      if (!f.birthDate || new Date(f.birthDate) >= new Date()) er.birthDate = t('rg_err_birth');
      if (!f.blood) er.blood = t('rg_err_blood');
    } else if (!cert || checkFile(cert, { maxBytes: 5 * 1024 * 1024 })) er.cert = t('rg_err_cert');
    if (!f.terms) er.terms = t('rg_err_terms');
    setErr(er); setApiErr('');
    if (Object.keys(er).length) return;
    setBusy(true);
    try {
      const r = await register({ role, fullName: f.fullName, email: f.email, phone: digits(f.phone), password: f.password, extra: role === 'lab' ? f.labName : role === 'doctor' ? f.specialty : '', license: role === 'patient' ? '' : f.license,
        ...(role === 'patient' ? { profile: { birthDate: f.birthDate, blood: f.blood, height: Number(digits(f.height)) || 0, weight: Number(digits(f.weight)) || 0, chronicIds } } : { certificate: cert }) });
      nav('/login', { replace: true, state: { email: f.email, registered: r?.status === 'pending' ? 'pending' : 'ok' } });
    } catch (x) { setApiErr(t(`err_${x.code}`) !== `err_${x.code}` ? t(`err_${x.code}`) : t('error')); setBusy(false); }
  };
  const Err = ({ k }) => (err[k] ? <div className="err">{err[k]}</div> : null);

  return (
    <>
      <h1>{t('rg_title')}</h1>
      <p className="auth-sub">{t('rg_sub')}</p>
      <div className="role-pick" role="radiogroup" aria-label={t('rg_as')}>
        {ROLES.map(([k, ic, label]) => (
          <button type="button" role="radio" aria-checked={role === k} key={k} className={`role-card ${role === k ? 'on' : ''}`} onClick={() => setRole(k)}><Icon name={ic} size={22} /><span>{t(label)}</span></button>
        ))}
      </div>
      <form onSubmit={submit} noValidate>
        <div className="auth-grid">
          <div className={role === 'lab' ? '' : 'full'}><label htmlFor="rg-name">{t('rg_name')}</label><input id="rg-name" value={f.fullName} maxLength={80} onChange={set('fullName')} autoComplete="name" /><Err k="fullName" /></div>
          {role === 'lab' && <div><label htmlFor="rg-lab">{t('rg_lab_name')}</label><input id="rg-lab" value={f.labName} maxLength={80} onChange={set('labName')} /><Err k="labName" /></div>}
          <div><label htmlFor="rg-email">{t('rg_email')}</label><input id="rg-email" type="email" dir="ltr" value={f.email} maxLength={254} onChange={set('email')} autoComplete="email" /><Err k="email" /></div>
          <div><label htmlFor="rg-phone">{t('rg_phone')}</label><input id="rg-phone" dir="ltr" inputMode="tel" value={f.phone} onChange={set('phone')} placeholder="01xxxxxxxxx" autoComplete="tel" /><Err k="phone" /></div>
          {role === 'doctor' && <div><label htmlFor="rg-sp">{t('rg_specialty')}</label><select id="rg-sp" value={f.specialty} onChange={set('specialty')}>{SPECS.map((s) => <option key={s} value={s}>{t(s)}</option>)}</select></div>}
          {role !== 'patient' && <div><label htmlFor="rg-lic">{t('rg_license')}</label><input id="rg-lic" dir="ltr" value={f.license} maxLength={40} onChange={set('license')} /><Err k="license" /></div>}
          <div><label htmlFor="rg-pass">{t('rg_pass')}</label><PasswordInput id="rg-pass" value={f.password} onChange={set('password')} autoComplete="new-password" /><Err k="password" /></div>
          <div><label htmlFor="rg-conf">{t('rg_confirm')}</label><PasswordInput id="rg-conf" value={f.confirm} onChange={set('confirm')} autoComplete="new-password" /><Err k="confirm" /></div>
        </div>
        {role === 'patient' && (
          <fieldset className="health-box">
            <legend>{t('rg_health')}</legend>
            <div className="auth-grid">
              <div><label htmlFor="rg-birth">{t('rg_birth')}</label><input id="rg-birth" type="date" max={new Date().toISOString().slice(0, 10)} value={f.birthDate} onChange={set('birthDate')} /><Err k="birthDate" /></div>
              <div><label htmlFor="rg-blood">{t('rg_blood')}</label><select id="rg-blood" value={f.blood} onChange={set('blood')}><option value="">—</option>{BLOOD_TYPES.map((b) => <option key={b}>{b}</option>)}</select><Err k="blood" /></div>
              <div><label htmlFor="rg-h">{t('rg_height')}</label><input id="rg-h" inputMode="numeric" value={f.height} onChange={set('height')} /></div>
              <div><label htmlFor="rg-w">{t('rg_weight')}</label><input id="rg-w" inputMode="numeric" value={f.weight} onChange={set('weight')} /></div>
            </div>
            <label>{t('rg_chronic')}</label>
            <div className="chips">
              <button type="button" className={`chip ${chronicIds.length === 0 ? 'on' : ''}`} onClick={() => setChronicIds([])}>{t('rg_chronic_none')}</button>
              {CHRONIC.map((c) => <button type="button" key={c.id} className={`chip ${chronicIds.includes(c.id) ? 'on' : ''}`} aria-pressed={chronicIds.includes(c.id)} onClick={() => toggleChronic(c.id)}>{lang === 'ar' ? c.ar : c.en}</button>)}
            </div>
          </fieldset>
        )}
        {role !== 'patient' && (
          <div className="cert-box">
            <label>{t('rg_cert')}</label>
            <input ref={certInput} type="file" accept="image/*,application/pdf" hidden onChange={(e) => { setCert(e.target.files?.[0] || null); e.target.value = ''; }} />
            <button type="button" className="cert-pick" onClick={() => certInput.current?.click()}>
              <Icon name={cert ? 'file' : 'upload'} size={20} /><span dir="auto">{cert ? cert.name : t('rg_cert_pick')}</span>
            </button>
            <small>{t('rg_cert_hint')}</small>
            <Err k="cert" />
          </div>
        )}
        {role !== 'patient' && <div className="note-line"><Icon name="info" size={16} />{t('rg_license_note')}</div>}
        <label className="check"><input type="checkbox" checked={f.terms} onChange={set('terms')} /><span>{t('rg_terms')}</span></label>
        <Err k="terms" />
        {apiErr && <div className="err" role="alert">{apiErr}</div>}
        <button type="submit" className="btn lg wide" disabled={busy}>{busy ? t('rg_ing') : t('rg_btn')}</button>
      </form>
      <p className="auth-foot">{t('rg_have')} <Link to="/login" className="link">{t('nav_login')}</Link></p>
    </>
  );
}
export default function Register() { return <AuthPage><Form /></AuthPage>; }
