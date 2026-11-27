import { useState } from 'react';
import Icon from '../../components/Icon.jsx';
import ConfirmForm from '../../components/ui/ConfirmForm.jsx';
import Switch from '../../components/ui/Switch.jsx';
import { Async } from '../../components/ui/States.jsx';
import { useAsync } from '../../components/ui/hooks.js';
import { useToast } from '../../components/ui/Toast.jsx';
import { useI18n } from '../../context/I18nContext.jsx';
import * as api from '../../api/admin.js';

const PAGES = ['monitoring', 'licenses', 'accounts', 'messages', 'reviews'];
const EMPTY = { name: '', email: '', password: '', perms: [] };

export default function AdminUsers() {
  const { t, num } = useI18n();
  const { act, toast } = useToast();
  const state = useAsync(() => api.getPanelUsers(), []);
  const [form, setForm] = useState(null); // null | {id?, ...}
  const [confirm, setConfirm] = useState(null); // {id, type}
  const [busy, setBusy] = useState(false);

  const replace = (u) => state.setData((l) => l.map((x) => (x.id === u.id ? u : x)));
  const togglePerm = (p) => setForm((f) => ({ ...f, perms: f.perms.includes(p) ? f.perms.filter((x) => x !== p) : [...f.perms, p] }));

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    let r;
    if (form.id) {
      const body = { name: form.name, perms: form.perms };
      if (form.password) body.password = form.password;
      r = await act(() => api.updatePanelUser(form.id, body));
      if (r) { replace(r); toast(t('adm_u_toast_save')); }
    } else {
      r = await act(() => api.addPanelUser(form));
      if (r) { state.setData((l) => [r, ...l]); toast(t('adm_u_toast_add')); }
    }
    setBusy(false);
    if (r) setForm(null);
  };
  const setActive = async (u, active) => {
    setBusy(true);
    const r = await act(() => api.updatePanelUser(u.id, { active }));
    setBusy(false);
    if (r) { replace(r); setConfirm(null); toast(t(active ? 'adm_u_toast_on' : 'adm_u_toast_off')); }
  };
  const remove = async (u) => {
    setBusy(true);
    const r = await act(() => api.deletePanelUser(u.id));
    setBusy(false);
    if (r) { state.setData((l) => l.filter((x) => x.id !== u.id)); setConfirm(null); toast(t('adm_u_toast_del')); }
  };
  const fmt = (d) => (d ? new Date(d).toLocaleString() : t('adm_u_never'));

  return (
    <section>
      <h1>{t('adm_u_title')}</h1>
      <p className="sub">{t('adm_u_sub')}</p>

      {form ? (
        <form className="card" onSubmit={submit} style={{ marginTop: 16 }}>
          <label className="first">{t('adm_u_name')}</label>
          <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required minLength={2} maxLength={80} />
          <label>{t('adm_u_email')}</label>
          <input type="email" dir="ltr" value={form.email} disabled={!!form.id} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
          <label>{form.id ? t('adm_u_pass_new') : t('adm_u_pass')}</label>
          <input type="password" dir="ltr" autoComplete="new-password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required={!form.id} minLength={form.id && !form.password ? 0 : 8} />
          <small>{t('adm_u_hint_pass')}</small>
          <div style={{ margin: '14px 0' }}>
            <b>{t('adm_u_perms')}</b>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14, marginTop: 8 }}>
              {PAGES.map((p) => (
                <label key={p} style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
                  <input type="checkbox" checked={form.perms.includes(p)} onChange={() => togglePerm(p)} />{t(`adm_pg_${p}`)}
                </label>
              ))}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn" type="submit" disabled={busy}>{form.id ? t('adm_u_save') : t('adm_u_create')}</button>
            <button className="btn o" type="button" onClick={() => setForm(null)}>{t('adm_u_cancel')}</button>
          </div>
        </form>
      ) : (
        <div style={{ marginTop: 16 }}><button className="btn" type="button" onClick={() => setForm({ ...EMPTY })}><Icon name="plusSm" size={16} /> {t('adm_u_add')}</button></div>
      )}

      <div className="card" style={{ marginTop: 16 }}>
        <Async state={state}>{(list) => (list || []).length === 0 ? <div className="state">{t('adm_u_empty')}</div> : list.map((u) => (
          <div className="row" key={u.id}>
            <div className="av">{u.name.charAt(0)}</div>
            <div className="m">
              <b>{u.name}</b>
              <small><span dir="ltr">{u.email}</span> · {u.perms.length ? u.perms.map((p) => t(`adm_pg_${p}`)).join('، ') : t('adm_u_none_perm')}</small>
              <small>{t('adm_u_last')}: {fmt(u.lastActiveAt)}</small>
            </div>
            <span className={`badge ${u.active ? 'ok' : 'wn'}`}>{u.active ? t('adm_u_active') : t('adm_u_disabled')}</span>
            <Switch on={u.active} label={u.name} disabled={busy} onChange={(v) => (v ? setActive(u, true) : setConfirm({ id: u.id, type: 'off' }))} />
            <button className="btn s o" type="button" onClick={() => setForm({ id: u.id, name: u.name, email: u.email, password: '', perms: [...u.perms] })}><Icon name="edit" size={14} /> {t('adm_u_edit')}</button>
            <button className="btn s dg" type="button" onClick={() => setConfirm({ id: u.id, type: 'del' })}><Icon name="trash" size={14} /> {t('adm_u_del')}</button>
            {confirm?.id === u.id && confirm.type === 'off' && <ConfirmForm message={`${t('adm_u_dis_ask')} ${u.name}؟`} confirmLabel={t('adm_u_dis_yes')} busy={busy} onConfirm={() => setActive(u, false)} onCancel={() => setConfirm(null)} />}
            {confirm?.id === u.id && confirm.type === 'del' && <ConfirmForm message={`${t('adm_u_del_ask')} ${u.name}؟`} confirmLabel={t('adm_u_del_yes')} busy={busy} onConfirm={() => remove(u)} onCancel={() => setConfirm(null)} />}
          </div>
        ))}</Async>
      </div>
    </section>
  );
}
