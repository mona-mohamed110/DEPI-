import { Fragment, useState } from 'react';
import Icon from '../../components/Icon.jsx';
import ConfirmForm from '../../components/ui/ConfirmForm.jsx';
import { Async } from '../../components/ui/States.jsx';
import { useAsync } from '../../components/ui/hooks.js';
import { useToast } from '../../components/ui/Toast.jsx';
import { useI18n } from '../../context/I18nContext.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { safeUrl } from '../../api/security.js';
import * as api from '../../api/patient.js';

const size = (b) => `${(b / (1024 * 1024)).toFixed(1)} MB`;

export default function MedicalFile() {
  const { t, L, num, fmtDate } = useI18n();
  const { user } = useAuth();
  const { act, toast } = useToast();
  const state = useAsync(() => api.getMedicalFile(), []);
  const [confirm, setConfirm] = useState(null);
  const [view, setView] = useState(null);
  const [busy, setBusy] = useState(false);
  const [hf, setHf] = useState(null);   // نموذج التاريخ المرضي: null | { id?, condition, date, notes }
  const [hErr, setHErr] = useState(false);

  const saveHistory = async (e) => {
    e.preventDefault();
    if (hf.condition.trim().length < 2) return setHErr(true);
    setHErr(false); setBusy(true);
    const body = { condition: hf.condition, date: hf.date, notes: hf.notes };
    const r = await act(() => (hf.id ? api.updateHistory(hf.id, body) : api.addHistory(body)), hf.id ? 'mf_updated' : 'mf_added');
    setBusy(false);
    if (r) { state.setData((d) => ({ ...d, history: hf.id ? d.history.map((h) => (h.id === r.id ? r : h)) : [r, ...d.history] })); setHf(null); }
  };

  const onFiles = async (e) => {
    const files = [...e.target.files];
    e.target.value = '';
    if (!files.length) return;
    setBusy(true);
    const added = await act(() => api.uploadReports(files), 'mf_uploaded');
    setBusy(false);
    if (added) state.setData((d) => ({ ...d, reports: [...added, ...d.reports] }));
  };
  const remove = async (id) => {
    setBusy(true);
    const ok = await act(() => api.deleteReport(id), 'mf_deleted');
    setBusy(false);
    if (ok) { state.setData((d) => ({ ...d, reports: d.reports.filter((r) => r.id !== id) })); setConfirm(null); if (view?.id === id) setView(null); }
  };
  const open = (r) => { const u = safeUrl(r.url); if (u) setView({ ...r, url: u }); else toast(t('mf_demo')); };

  return (
    <section>
      <h1>{t('mf_title')}</h1>
      <p className="sub">{t('mf_sub')}</p>
      <Async state={state}>{(d) => (
        <>
          <div className="card">
            <h2>{t('mf_personal')}</h2>
            <div className="info-grid">
              <div className="row"><span className="c">{t('age')}</span><b>{d.info.age != null ? t('years', { n: num(d.info.age) }) : '—'}</b></div>
              <div className="row"><span className="c">{t('name')}</span><b>{L(user.name)}</b></div>
              <div className="row"><span className="c">{t('blood')}</span><b dir="ltr">{d.info.blood || '—'}</b></div>
              <div className="row"><span className="c">{t('height_weight')}</span><b>{d.info.height ? `${num(d.info.height)} ${t('cm')} / ${num(d.info.weight)} ${t('kg')}` : '—'}</b></div>
            </div>
            <label>{t('mf_chronic')}</label>
            <div className="chips">{d.chronic.length ? d.chronic.map((c, i) => <span key={i} className="badge">{L(c)}</span>) : <span className="sub" style={{ margin: 0 }}>{t('d_none')}</span>}</div>
          </div>

          <div className="card" style={{ marginTop: 16 }}>
            <div className="card-head">
              <h2>{t('mf_history')}</h2>
              <button type="button" className="btn s" onClick={() => { setHErr(false); setHf({ condition: '', date: '', notes: '' }); }}><Icon name="plusSm" size={16} />{t('mf_add')}</button>
            </div>
            {hf && (
              <form className="hist-form" onSubmit={saveHistory} noValidate>
                <h3 style={{ margin: '0 0 8px' }}>{t(hf.id ? 'mf_form_edit' : 'mf_form_add')}</h3>
                <div className="form" style={{ width: '100%' }}>
                  <div><label className="first">{t('mf_cond')}</label><input value={hf.condition} maxLength={120} onChange={(e) => setHf({ ...hf, condition: e.target.value })} autoFocus />{hErr && <div className="err">{t('mf_err')}</div>}</div>
                  <div><label className="first">{t('mf_date')}</label><input type="date" max={new Date().toISOString().slice(0, 10)} value={hf.date} onChange={(e) => setHf({ ...hf, date: e.target.value })} /></div>
                  <div className="full"><label>{t('mf_notes')}</label><textarea rows={2} maxLength={500} value={hf.notes} onChange={(e) => setHf({ ...hf, notes: e.target.value })} /></div>
                </div>
                <div className="btn-row">
                  <button type="submit" className="btn" disabled={busy}>{t(hf.id ? 'mf_save_edit' : 'mf_save_add')}</button>
                  <button type="button" className="btn o" onClick={() => setHf(null)}>{t('cancel')}</button>
                </div>
              </form>
            )}
            <div className="scroll"><table>
              <thead><tr><th>{t('mf_cond')}</th><th>{t('mf_date')}</th><th>{t('mf_notes')}</th><th /></tr></thead>
              <tbody>{d.history.length === 0 ? <tr><td colSpan={4} className="sub">{t('no_results')}</td></tr> : d.history.map((h) => (
                <tr key={h.id}>
                  <td><b>{L(h.condition)}</b></td><td>{h.date ? fmtDate(h.date) : '—'}</td><td>{L(h.notes)}</td>
                  <td><button type="button" className="btn s o" onClick={() => { setHErr(false); setHf({ id: h.id, condition: L(h.condition), date: h.date || '', notes: L(h.notes) }); }}><Icon name="edit" size={15} />{t('mf_edit')}</button></td>
                </tr>
              ))}</tbody>
            </table></div>
          </div>

          <div className="card" style={{ marginTop: 16 }}>
            <h2>{t('mf_attach')}</h2>
            <label className="drop">
              <input type="file" multiple accept=".pdf,image/*" onChange={onFiles} disabled={busy} />
              <Icon name="upload" size={32} /><b>{busy ? t('loading') : t('mf_drop')}</b><small>{t('mf_types')}</small>
            </label>
          </div>

          <div className="card" style={{ marginTop: 16 }}>
            <h2>{t('mf_reports')}</h2>
            {d.reports.length === 0 ? <div className="state">{t('mf_empty')}</div> : (
              <div className="scroll"><table>
                <thead><tr><th>{t('mf_file')}</th><th>{t('mf_up_date')}</th><th>{t('mf_size')}</th><th /></tr></thead>
                <tbody>{d.reports.map((r) => (
                  <Fragment key={r.id}>
                    <tr>
                      <td><span className="file-chip"><Icon name="file" size={18} /><b dir="ltr">{r.name}</b></span></td>
                      <td>{fmtDate(r.date)}</td><td>{size(r.size)}</td>
                      <td><div className="act-group" style={{ display: 'flex', gap: 6 }}>
                        <button type="button" className="btn s o" onClick={() => open(r)}><Icon name="eye" size={16} />{t('view')}</button>
                        <button type="button" className="btn s o dg" onClick={() => setConfirm(r.id)}><Icon name="trash" size={16} />{t('delete')}</button>
                      </div></td>
                    </tr>
                    {confirm === r.id && (
                      <tr><td colSpan={4}>
                        <ConfirmForm message={t('mf_del_q', { name: r.name })} busy={busy} onConfirm={() => remove(r.id)} onCancel={() => setConfirm(null)} />
                      </td></tr>
                    )}
                  </Fragment>
                ))}</tbody>
              </table></div>
            )}
            {view && (
              <div className="viewer">
                <div className="viewer-h"><b dir="ltr">{view.name}</b><button type="button" className="icon-btn" onClick={() => setView(null)} aria-label={t('close')}><Icon name="x" size={18} /></button></div>
                {view.type === 'pdf' ? <iframe src={view.url} title={view.name} /> : <img src={view.url} alt={view.name} />}
              </div>
            )}
          </div>
        </>
      )}</Async>
    </section>
  );
}
