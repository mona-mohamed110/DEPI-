import { useState } from 'react';
import Icon from '../../components/Icon.jsx';
import ConfirmForm from '../../components/ui/ConfirmForm.jsx';
import Stars from '../../components/ui/Stars.jsx';
import Switch from '../../components/ui/Switch.jsx';
import { Async } from '../../components/ui/States.jsx';
import { useAsync } from '../../components/ui/hooks.js';
import { useToast } from '../../components/ui/Toast.jsx';
import { useI18n } from '../../context/I18nContext.jsx';
import * as api from '../../api/reviews.js';

const TABS = [['platform', 'adm_rv_platform', {}], ['doctor', 'adm_rv_doctors', { type: 'provider', role: 'doctor' }], ['lab', 'adm_rv_labs', { type: 'provider', role: 'lab' }]];
const STATUSES = ['', 'pending', 'approved', 'rejected'];
const TONE = { pending: 'wn', approved: 'ok', rejected: 'dg' };

export default function Reviews() {
  const { t, num, fmtDateTime } = useI18n();
  const { act, toast } = useToast();
  const [tab, setTab] = useState('platform');
  const [status, setStatus] = useState('');
  const [confirm, setConfirm] = useState(null);
  const [busy, setBusy] = useState(false);
  const q = tab === 'platform' ? { type: 'platform', status } : { ...TABS.find((x) => x[0] === tab)[2], status };
  const state = useAsync(() => api.getAdminReviews(q), [tab, status]);
  const site = useAsync(() => api.getReviewSettings(), []);
  const toggleSection = async (v) => {
    setBusy(true);
    const r = await act(() => api.saveReviewSettings({ showTestimonials: v }));
    setBusy(false);
    if (r) { site.setData(r); toast(t('adm_rv_toast')); }
  };

  const patch = async (r, body) => {
    setBusy(true);
    const u = await act(() => api.updateAdminReview(r.id, body));
    setBusy(false);
    if (u) { toast(t('adm_rv_toast')); state.reload(); }
  };
  const remove = async (r) => {
    setBusy(true);
    const u = await act(() => api.deleteAdminReview(r.id));
    setBusy(false);
    if (u) { setConfirm(null); state.reload(); }
  };

  return (
    <section>
      <h1>{t('adm_rv_title')}</h1>
      <p className="sub">{t('adm_rv_sub')}</p>
      <div className="card" style={{ marginTop: 16, display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <div className="m" style={{ flex: 1, minWidth: 200 }}><b>{t('adm_rv_section')}</b><small>{t('adm_rv_section_sub')}</small></div>
        {site.data && <><span className={`badge ${site.data.showTestimonials ? 'ok' : 'wn'}`}>{t(site.data.showTestimonials ? 'adm_rv_shown' : 'adm_rv_hidden')}</span>
          <Switch on={site.data.showTestimonials} label={t('adm_rv_section')} disabled={busy} onChange={toggleSection} /></>}
      </div>
      <div className="card" style={{ marginTop: 16 }}>
        <div className="tabs">{TABS.map(([k, label]) => <button type="button" key={k} className={tab === k ? 'on' : ''} onClick={() => setTab(k)}>{t(label)}</button>)}</div>
        <div className="tabs">{STATUSES.map((s) => <button type="button" key={s || 'all'} className={status === s ? 'on' : ''} onClick={() => setStatus(s)}>{s ? t(`fb_st_${s}`) : t('adm_rv_all')}</button>)}</div>
        <Async state={state}>{(d) => (
          <>
            <p className="sub">{t('adm_rv_pending')}: <b>{num(d.pending)}</b> · {t('adm_rv_count')}: <b>{num(d.featured)}/{num(d.maxFeatured)}</b></p>
            {d.items.length === 0 ? <div className="state">{t('adm_rv_empty')}</div> : d.items.map((r) => (
              <div className="row" key={r.id} style={{ flexWrap: 'wrap' }}>
                <div className="m">
                  <Stars value={r.rating} size={18} />
                  <b>{r.type === 'platform' ? `${t('adm_rv_by')} ${r.authorName} (${t(`tm_role_${r.authorRole}`)})` : `${t('adm_rv_for')} ${r.targetName} — ${t('adm_rv_by')} ${r.authorName}`}</b>
                  <small style={{ whiteSpace: 'pre-wrap' }}>{r.comment || t('adm_rv_no_comment')}</small>
                  <small>{fmtDateTime(r.createdAt)}</small>
                </div>
                <span className={`badge ${TONE[r.status]}`}>{t(`fb_st_${r.status}`)}</span>
                {r.featured && <span className="badge ok"><Icon name="star" size={13} /> {t('adm_rv_featured')}</span>}
                {r.status !== 'approved' && <button type="button" className="btn s" disabled={busy} onClick={() => patch(r, { status: 'approved' })}>{t('adm_rv_approve')}</button>}
                {r.status !== 'rejected' && <button type="button" className="btn s o" disabled={busy} onClick={() => patch(r, { status: 'rejected' })}>{t('adm_rv_reject')}</button>}
                {r.type === 'platform' && r.status === 'approved' && <button type="button" className="btn s o" disabled={busy} onClick={() => patch(r, { featured: !r.featured })}>{r.featured ? t('adm_rv_unfeature') : t('adm_rv_feature')}</button>}
                <button type="button" className="btn s dg" disabled={busy} onClick={() => setConfirm(r.id)}><Icon name="trash" size={14} /> {t('adm_rv_delete')}</button>
                {confirm === r.id && <ConfirmForm message={t('adm_rv_del_ask')} confirmLabel={t('adm_rv_del_yes')} busy={busy} onConfirm={() => remove(r)} onCancel={() => setConfirm(null)} />}
              </div>
            ))}
          </>
        )}</Async>
      </div>
    </section>
  );
}
