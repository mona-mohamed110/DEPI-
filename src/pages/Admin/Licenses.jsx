import { useState } from 'react';
import Icon from '../../components/Icon.jsx';
import ConfirmForm from '../../components/ui/ConfirmForm.jsx';
import { Async } from '../../components/ui/States.jsx';
import { useAsync } from '../../components/ui/hooks.js';
import { useToast } from '../../components/ui/Toast.jsx';
import { useI18n } from '../../context/I18nContext.jsx';
import { safeUrl } from '../../api/security.js';
import * as api from '../../api/admin.js';

const TABS = [['pend', 'adm_lic_pend'], ['ok', 'adm_lic_ok'], ['no', 'adm_lic_no']];
const TONE = { pend: 'wn', ok: 'ok', no: 'dg' };

export default function Licenses() {
  const { t, L, fmtDateTime } = useI18n();
  const { act } = useToast();
  const state = useAsync(() => api.getLicenses(), []);
  const [tab, setTab] = useState('pend');
  const [panel, setPanel] = useState(null);   // { id, kind: 'view' | 'approve' | 'reject' }
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  const open = (id, kind) => { setPanel({ id, kind }); setReason(''); };
  const replace = (r) => state.setData((l) => l.map((x) => (x.id === r.id ? r : x)));

  const approve = async (id) => {
    setBusy(true);
    const r = await act(() => api.approveLicense(id), 'adm_toast_approved');
    setBusy(false);
    if (r) { replace(r); setPanel(null); }
  };
  const reject = async (id) => {
    if (reason.trim().length < 2) return;
    setBusy(true);
    const r = await act(() => api.rejectLicense(id, reason), 'adm_toast_rejected');
    setBusy(false);
    if (r) { replace(r); setPanel(null); }
  };

  return (
    <section>
      <h1>{t('adm_lic_title')}</h1>
      <p className="sub">{t('adm_lic_sub')}</p>
      <Async state={state}>{(all) => {
        const list = all.filter((x) => x.status === tab);
        return (
          <>
            <div className="tabs">{TABS.map(([k, label]) => <button type="button" key={k} className={tab === k ? 'on' : ''} onClick={() => { setTab(k); setPanel(null); }}>{t(label)} ({all.filter((x) => x.status === k).length})</button>)}</div>
            <div className="card">
              {list.length === 0 ? <div className="state">{t('adm_lic_empty')}</div> : list.map((l) => (
                <div className="row" key={l.id}>
                  <div className="av"><Icon name={l.type === 'lab' ? 'flask' : 'stethoscope'} size={20} /></div>
                  <div className="m">
                    <b>{L(l.name)}</b>
                    <small>{t(`adm_type_${l.type}`)} · {t('adm_lic_number')}: <span dir="ltr">{l.number}</span> · {t('adm_lic_by')}: {t(`adm_by_${l.by}`)} · {fmtDateTime(l.sentAt)}</small>
                    {l.status === 'no' && l.reason && <small style={{ color: 'var(--dg)' }}>{L(l.reason)}</small>}
                  </div>
                  <span className={`badge ${TONE[l.status]}`}>{l.status === 'pend' ? t('adm_lic_pend') : l.status === 'ok' ? t('adm_lic_approved') : t('adm_lic_rejected')}</span>
                  <button type="button" className="btn s o" onClick={() => open(l.id, 'view')}><Icon name="eye" size={15} />{t('adm_lic_view')}</button>
                  {l.status === 'pend' && (
                    <>
                      <button type="button" className="btn s" onClick={() => open(l.id, 'approve')}>{t('adm_lic_approve')}</button>
                      <button type="button" className="btn s o dg" onClick={() => open(l.id, 'reject')}>{t('adm_lic_reject')}</button>
                    </>
                  )}

                  {panel?.id === l.id && panel.kind === 'view' && (
                    <div className="preview" style={{ width: '100%' }}>
                      <b>{t('adm_lic_preview')} — {L(l.name)}</b>
                      {l.file && safeUrl(l.file.dataUrl)
                        ? (l.file.type === 'application/pdf' ? <iframe title={l.file.name} src={l.file.dataUrl} style={{ width: '100%', height: 360, border: 0, background: '#fff', borderRadius: 10, marginTop: 8 }} /> : <img src={l.file.dataUrl} alt={l.file.name} style={{ maxWidth: '100%', maxHeight: 360, marginTop: 8, borderRadius: 10 }} />)
                        : <div><Icon name="file" size={36} />{l.file && <div dir="ltr">{l.file.name}</div>}</div>}
                      <button type="button" className="btn s o" onClick={() => setPanel(null)}>{t('adm_lic_close')}</button>
                    </div>
                  )}
                  {panel?.id === l.id && panel.kind === 'approve' && (
                    <ConfirmForm danger={false} message={t('adm_lic_approve_ask')} confirmLabel={t('adm_lic_approve_yes')} busy={busy} onConfirm={() => approve(l.id)} onCancel={() => setPanel(null)} />
                  )}
                  {panel?.id === l.id && panel.kind === 'reject' && (
                    <ConfirmForm message={t('adm_lic_reject_title')} confirmLabel={t('adm_lic_reject_yes')} busy={busy || reason.trim().length < 2} onConfirm={() => reject(l.id)} onCancel={() => setPanel(null)}>
                      <textarea rows={2} maxLength={200} value={reason} onChange={(e) => setReason(e.target.value)} placeholder={t('adm_lic_reject_ph')} />
                    </ConfirmForm>
                  )}
                </div>
              ))}
            </div>
          </>
        );
      }}</Async>
    </section>
  );
}
