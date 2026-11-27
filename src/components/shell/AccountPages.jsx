// صفحتا الملف الشخصي وإعدادات الحساب — مشتركتين بين كل الأدوار (نفس الشكل، كل جزء بالـ CSS الخاص بيه)
import { useRef, useState } from 'react';
import { useI18n } from '../../context/I18nContext.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { useToast } from '../ui/Toast.jsx';
import { useAsync } from '../ui/hooks.js';
import { Async } from '../ui/States.jsx';
import Switch from '../ui/Switch.jsx';
import Avatar from '../ui/Avatar.jsx';
import Icon from '../Icon.jsx';
import * as shared from '../../api/shared.js';
import * as authApi from '../../api/auth.js';
import { isEmail, isStrongPassword } from '../../api/security.js';
import { useNavigate } from 'react-router-dom';
import { clearSession } from '../../api/security.js';

// كارت البيانات الشخصية (الاسم، الإيميل، الهاتف) — بيتستخدم في صفحة الملف الشخصي لكل الأدوار
export function PersonalCard({ className = 'card' }) {
  const { t, L } = useI18n();
  const { updateUser, avatar, setAvatar } = useAuth();
  const { act, toast } = useToast();
  const fileRef = useRef(null);
  const [photoBusy, setPhotoBusy] = useState(false);
  const state = useAsync(() => shared.getMe(), []);

  // تصغير الصورة إلى مربع 256px بصيغة JPEG قبل الرفع
  const toJpeg = (file) => new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const side = Math.min(img.width, img.height), S = 256;
      if (side < 128) { URL.revokeObjectURL(url); reject(new Error('small')); return; }
      const c = document.createElement('canvas');
      c.width = S; c.height = S;
      const g = c.getContext('2d');
      g.fillStyle = '#fff'; g.fillRect(0, 0, S, S);
      g.drawImage(img, (img.width - side) / 2, (img.height - side) / 2, side, side, 0, 0, S, S);
      URL.revokeObjectURL(url);
      resolve(c.toDataURL('image/jpeg', 0.85));
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('read')); };
    img.src = url;
  });
  const pickPhoto = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (!/^image\//.test(file.type) || file.size > 10 * 1024 * 1024) return toast(t('err_invalid_image'));
    setPhotoBusy(true);
    try {
      const data = await toJpeg(file);
      const r = await act(() => shared.saveAvatar(data));
      if (r) { setAvatar(r.avatar); toast(t('pf_photo_ok')); }
    } catch (er) { toast(t(er && er.message === 'small' ? 'err_photo_small' : 'err_invalid_image')); }
    setPhotoBusy(false);
  };
  const dropPhoto = async () => {
    setPhotoBusy(true);
    const r = await act(() => shared.removeAvatar());
    setPhotoBusy(false);
    if (r) { setAvatar(''); toast(t('pf_photo_removed')); }
  };
  const [form, setForm] = useState(null);
  const [err, setErr] = useState({});
  const startEdit = (me) => { setErr({}); setForm({ name: L(me.name), email: me.email, phone: me.phone || '' }); };
  const save = async (e) => {
    e.preventDefault();
    const er = {};
    if (form.name.trim().length < 2) er.name = true;
    if (!isEmail(form.email)) er.email = true;
    if (form.phone && !/^\d{11}$/.test(String(form.phone).replace(/[\s-]/g, ''))) er.phone = true;
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
            <Avatar name={L(me.name)} src={avatar} size={72} />
            <div>
              <b>{L(me.name)}</b><span className="badge">{t(`role_${me.role}`)}</span>
              <div className="btn-row" style={{ marginTop: 8 }}>
                {/* صورة واحدة فقط: إما حذف الحالية، أو رفع جديدة بعد الحذف */}
                {avatar
                  ? <button type="button" className="btn s dg" disabled={photoBusy} onClick={dropPhoto}><Icon name="trash" size={14} /> {t('pf_photo_remove')}</button>
                  : <button type="button" className="btn s o" disabled={photoBusy} onClick={() => fileRef.current?.click()}><Icon name="upload" size={14} /> {t('pf_photo_add')}</button>}
                <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/webp" hidden onChange={pickPhoto} />
              </div>
              <small style={{ display: 'block', marginTop: 6, color: 'var(--mu)' }}>{t('pf_photo_hint')}</small>
            </div>
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
              <input dir="ltr" inputMode="tel" maxLength={11} value={form.phone} onChange={(e) => setForm({ ...form, phone: String(e.target.value).replace(/[٠-٩]/g, (d) => '٠١٢٣٤٥٦٧٨٩'.indexOf(d)).replace(/\D/g, '').slice(0, 11) })} autoComplete="tel" />
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

export function AccountPage() {
  const { t } = useI18n();
  const { user } = useAuth();
  const { act } = useToast();
  const navigate = useNavigate();
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
  const logoutAll = async () => {
  const result = await act(
    () => shared.logoutAll(),
    'logout_all_done'
  );

  if (result) {
    clearSession();
    navigate('/login', { replace: true });
  }
};

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
              <h2>{t('acc_security')}</h2>
              <div className="row"><div className="m">{t('two_factor')}</div><Switch on={!!me.twoFactor} onChange={(v) => setPref('twoFactor', v)} label={t('two_factor')} /></div>
              <div className="row"><div className="m">{t('logout_all')}</div><button type="button" className="btn o s" onClick={logoutAll}>{t('run')}</button></div>
            </div>
            {user?.role === 'doctor' && (
              <div className="card" style={{ marginTop: 16 }}>
                <h2>{t('acc_clinic')}</h2>
                <div className="row"><div className="m">{t('queue_only')}<small style={{ display: 'block', color: 'var(--mu)' }}>{t('queue_only_hint')}</small></div><Switch on={!!me.queueOnly} onChange={(v) => setPref('queueOnly', v)} label={t('queue_only')} /></div>
              </div>
            )}
          </div>
        )}</Async>
      </div>
    </section>
  );
}
