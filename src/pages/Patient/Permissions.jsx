import { useState } from 'react';
import Icon from '../../components/Icon.jsx';
import ConfirmForm from '../../components/ui/ConfirmForm.jsx';
import { Async } from '../../components/ui/States.jsx';
import { useAsync } from '../../components/ui/hooks.js';
import { useToast } from '../../components/ui/Toast.jsx';
import { useI18n } from '../../context/I18nContext.jsx';
import { usePatient } from './PatientContext.jsx';
import * as api from '../../api/patient.js';

const KIND = { doctor: 'stethoscope', lab: 'flask' };

function Active() {
  const { t, L, fmtDate } = useI18n();
  const { act } = useToast();
  const { refreshPerms } = usePatient();
  const state = useAsync(() => api.getActivePermissions(), []);
  const [confirm, setConfirm] = useState(null); // id | 'all'
  const [busy, setBusy] = useState(false);

  const revoke = async (id) => {
    setBusy(true);
    const ok = await act(() => (id === 'all' ? api.revokeAllPermissions() : api.revokePermission(id)), 'pm_revoked');
    setBusy(false);
    if (ok) { state.setData((l) => (id === 'all' ? [] : l.filter((x) => x.id !== id))); setConfirm(null); refreshPerms(); }
  };

  return (
    <Async state={state}>{(list) => (
      <>
        <div className="card">
          {list.length === 0 ? <div className="state">{t('pm_active_empty')}</div> : list.map((g) => (
            <div className="row" key={g.id}>
              <div className="res-icon"><Icon name={KIND[g.kind] || 'user'} size={22} /></div>
              <div className="m"><b>{L(g.grantee)}</b><small>{L(g.scope)} · {g.until ? t('pm_until', { date: fmtDate(g.until) }) : t('pm_forever')}</small></div>
              <span className="badge ok">{t('pm_active_pill')}</span>
              <button type="button" className="btn s o dg" onClick={() => setConfirm(g.id)}>{t('pm_revoke')}</button>
              {confirm === g.id && <ConfirmForm message={t('pm_dlg_one_msg', { name: L(g.grantee) })} confirmLabel={t('pm_dlg_one_ok')} busy={busy} onConfirm={() => revoke(g.id)} onCancel={() => setConfirm(null)} />}
            </div>
          ))}
        </div>
        {list.length > 0 && (
          <div className="card danger-card" style={{ marginTop: 16 }}>
            <div className="row" style={{ border: 0, padding: 0 }}>
              <Icon name="alert" size={22} />
              <div className="m"><b>{t('pm_revoke_all_title')}</b><small>{t('pm_revoke_all_desc')}</small></div>
              <button type="button" className="btn dg" onClick={() => setConfirm('all')}>{t('pm_revoke_now')}</button>
            </div>
            {confirm === 'all' && <ConfirmForm message={t('pm_dlg_all_msg', { n: list.length })} confirmLabel={t('pm_dlg_all_ok')} busy={busy} onConfirm={() => revoke('all')} onCancel={() => setConfirm(null)} />}
          </div>
        )}
      </>
    )}</Async>
  );
}

function Log() {
  const { t, L, fmtDateTime } = useI18n();
  const state = useAsync(() => api.getAccessLog(), []);
  return (
    <div className="card"><Async state={state}>{(list) => list.length === 0 ? <div className="state">{t('pm_log_empty')}</div> : list.map((l) => (
      <div className="row" key={l.id}>
        <div className="res-icon"><Icon name="eye" size={20} /></div>
        <div className="m"><b>{L(l.who)}</b><small>{L(l.action)}</small></div>
        <small>{fmtDateTime(l.at)}</small>
      </div>
    ))}</Async></div>
  );
}

export default function Permissions() {
  const { t } = useI18n();
  const [tab, setTab] = useState('active');
  const TABS = [['active', 'pm_tab_active'], ['log', 'pm_tab_log']];
  return (
    <section>
      <h1>{t('pm_title')}</h1>
      <p className="sub">{t('pm_sub')}</p>
      <div className="perm-tabs" role="tablist" aria-label={t('pm_tabs_label')}>
        {TABS.map(([k, label]) => <button key={k} type="button" role="tab" aria-selected={tab === k} className={tab === k ? 'on' : ''} onClick={() => setTab(k)}>{t(label)}</button>)}
      </div>
      {tab === 'active' ? <Active /> : <Log />}
    </section>
  );
}
