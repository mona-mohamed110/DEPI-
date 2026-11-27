import { useEffect, useState } from 'react';
import Icon from '../../components/Icon.jsx';
import { Async } from '../../components/ui/States.jsx';
import { useAsync } from '../../components/ui/hooks.js';
import { useI18n } from '../../context/I18nContext.jsx';
import * as api from '../../api/admin.js';

const ACTIONS = ['login', 'license_approve', 'license_reject', 'account_enable', 'account_disable', 'message_reply', 'message_status', 'message_delete', 'admin_user_create', 'admin_user_update', 'admin_user_enable', 'admin_user_disable', 'admin_user_delete', 'email_design_update', 'email_design_logo', 'email_design_test', 'review_approve', 'review_reject', 'review_pending', 'review_feature', 'review_unfeature', 'review_delete', 'review_section_show', 'review_section_hide'];

export default function ActivityLog() {
  const { t, num } = useI18n();
  const [f, setF] = useState({ user: '', action: '', from: '', to: '' });
  const [page, setPage] = useState(1);
  const users = useAsync(() => api.getPanelUsers(), []);
  const state = useAsync(() => api.getActivity({ ...f, page }), [f, page]);
  useEffect(() => { setPage(1); }, [f]);
  const set = (k) => (e) => setF((x) => ({ ...x, [k]: e.target.value }));
  const when = (d) => new Date(d).toLocaleString();

  const exportCsv = () => {
    const rows = state.data?.items || [];
    const esc = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
    const head = ['time', 'user', 'email', 'action', 'target', 'detail', 'ip'];
    const csv = [head.join(','), ...rows.map((r) => [new Date(r.at).toISOString(), r.actorName, r.actorEmail, r.action, r.target, r.detail, r.ip].map(esc).join(','))].join('\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' }));
    a.download = 'activity-log.csv';
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  };

  return (
    <section>
      <h1>{t('adm_l_title')}</h1>
      <p className="sub">{t('adm_l_sub')}</p>
      <div className="card" style={{ marginTop: 16 }}>
        <div className="filters" style={{ display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'end' }}>
          <div><label>{t('adm_l_user')}</label>
            <select value={f.user} onChange={set('user')}>
              <option value="">{t('adm_l_all_users')}</option>
              {(users.data || []).map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
            </select></div>
          <div><label>{t('adm_l_action')}</label>
            <select value={f.action} onChange={set('action')}>
              <option value="">{t('adm_l_all_actions')}</option>
              {ACTIONS.map((a) => <option key={a} value={a}>{t(`adm_act_${a}`)}</option>)}
            </select></div>
          <div><label>{t('adm_l_from')}</label><input type="date" value={f.from} onChange={set('from')} /></div>
          <div><label>{t('adm_l_to')}</label><input type="date" value={f.to} onChange={set('to')} /></div>
          <button className="btn s o" type="button" onClick={exportCsv} disabled={!state.data?.items?.length}><Icon name="download" size={14} /> {t('adm_l_export')}</button>
        </div>
        <Async state={state}>{(d) => (d.items.length === 0 ? <div className="state">{t('adm_l_empty')}</div> : (
          <>
            <small>{t('adm_l_total')}: {num(d.total)}</small>
            <div style={{ overflowX: 'auto' }}>
              <table>
                <thead><tr><th>{t('adm_l_when')}</th><th>{t('adm_l_user')}</th><th>{t('adm_l_action')}</th><th>{t('adm_l_target')}</th><th>{t('adm_l_detail')}</th></tr></thead>
                <tbody>{d.items.map((r) => (
                  <tr key={r.id}>
                    <td>{when(r.at)}</td>
                    <td><b>{r.actorName}</b><br /><small dir="ltr">{r.actorEmail}</small><br /><span className={`badge ${r.isSub ? 'wn' : 'ok'}`}>{r.isSub ? t('adm_l_sub_tag') : t('adm_l_main')}</span></td>
                    <td>{t(`adm_act_${r.action}`)}</td>
                    <td>{r.target || '—'}</td>
                    <td>{r.detail || '—'}{r.ip ? <><br /><small dir="ltr">{r.ip}</small></> : null}</td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center', justifyContent: 'center', marginTop: 12 }}>
              <button className="btn s o" type="button" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>{t('adm_l_prev')}</button>
              <span>{t('adm_l_page')} {num(d.page)} {t('adm_l_of')} {num(d.pages)}</span>
              <button className="btn s o" type="button" disabled={page >= d.pages} onClick={() => setPage((p) => p + 1)}>{t('adm_l_next')}</button>
            </div>
          </>
        ))}</Async>
      </div>
    </section>
  );
}
