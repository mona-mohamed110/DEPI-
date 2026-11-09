import { useMemo, useState } from 'react';
import Icon from '../../components/Icon.jsx';
import ConfirmForm from '../../components/ui/ConfirmForm.jsx';
import Switch from '../../components/ui/Switch.jsx';
import { Async } from '../../components/ui/States.jsx';
import { useAsync } from '../../components/ui/hooks.js';
import { useToast } from '../../components/ui/Toast.jsx';
import { useI18n } from '../../context/I18nContext.jsx';
import * as api from '../../api/admin.js';

const TABS = [['all', 'adm_tab_all'], ['patient', 'adm_tab_pt'], ['doctor', 'adm_tab_dr'], ['lab', 'adm_tab_lab'], ['reception', 'adm_tab_rc']];
const ROLE = { patient: 'adm_role_pt', doctor: 'adm_role_dr', lab: 'adm_role_lab', reception: 'adm_role_rc' };

export default function Accounts() {
  const { t, L, num } = useI18n();
  const { act, toast } = useToast();
  const state = useAsync(() => api.getAccounts(), []);
  const [tab, setTab] = useState('all');
  const [q, setQ] = useState('');
  const [confirm, setConfirm] = useState(null);
  const [busy, setBusy] = useState(false);

  const set = async (acc, active) => {
    setBusy(true);
    const r = await act(() => api.setAccountActive(acc.id, active));
    setBusy(false);
    if (r) { state.setData((l) => l.map((x) => (x.id === acc.id ? r : x))); setConfirm(null); toast(`${t(active ? 'adm_toast_activated' : 'adm_toast_stopped')} ${L(acc.name)}`); }
  };
  const list = useMemo(() => (state.data || []).filter((a) => (tab === 'all' || a.role === tab) && `${L(a.name)} ${a.email}`.toLowerCase().includes(q.trim().toLowerCase())), [state.data, tab, q, L]);
  const all = state.data || [];

  return (
    <section>
      <h1>{t('adm_acc_title')}</h1>
      <p className="sub">{t('adm_acc_sub')}</p>
      <div className="grid g3">
        {[['adm_acc_total', all.length, 'users', ''], ['adm_acc_active', all.filter((a) => a.active).length, 'checkc', 'ok'], ['adm_acc_stopped', all.filter((a) => !a.active).length, 'lock', 'wn']].map(([k, v, ic, tone]) => (
          <div className="card stat" key={k}><div className={`tile ${tone}`}><Icon name={ic} size={22} /></div><span>{t(k)}</span><b>{num(v)}</b></div>
        ))}
      </div>
      <div className="card" style={{ marginTop: 16 }}>
        <div className="filters"><div className="search"><Icon name="search" size={18} /><input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t('adm_acc_search')} /></div></div>
        <div className="tabs">{TABS.map(([k, label]) => <button type="button" key={k} className={tab === k ? 'on' : ''} onClick={() => setTab(k)}>{t(label)}</button>)}</div>
        <Async state={state}>{() => list.length === 0 ? <div className="state">{t('adm_none')}</div> : list.map((a) => (
          <div className="row" key={a.id}>
            <div className="av">{L(a.name).replace(/^(د\.|Dr\.)\s*/, '').charAt(0)}</div>
            <div className="m"><b>{L(a.name)}</b><small><span dir="ltr">{a.email}</span> · {t(ROLE[a.role])}</small></div>
            <span className={`badge ${a.active ? 'ok' : 'wn'}`}>{a.active ? t('adm_on') : t('adm_off')}</span>
            <Switch on={a.active} label={L(a.name)} onChange={(v) => (v ? set(a, true) : setConfirm(a.id))} />
            {confirm === a.id && <ConfirmForm message={`${t('adm_stop_ask')} ${L(a.name)}؟`} confirmLabel={t('adm_stop_yes')} busy={busy} onConfirm={() => set(a, false)} onCancel={() => setConfirm(null)} />}
          </div>
        ))}</Async>
      </div>
    </section>
  );
}
