import { useState } from 'react';
import Icon from '../Icon.jsx';
import RxCard from './RxCard.jsx';
import { useI18n } from '../../context/I18nContext.jsx';
import { safeUrl } from '../../api/security.js';
import { fetchProtectedBlobUrl } from '../../api/http.js';
import { USE_MOCK } from '../../config/env.js';

const ICON = { lab: 'tube', xray: 'scan', ecg: 'activity' };
const TONE = { normal: 'ok', low: 'wn', followup: 'dg' };

// عرض الملف الطبي بالكامل للقراءة فقط (من غير أي خانات تعديل أو إضافة) — بيستخدمه الدكتور
export default function FileView({ file }) {
  const { t, L, num, fmtDate } = useI18n();
  const [view, setView] = useState(null);
  const i = file.info || {};
  const [loading, setLoading] = useState(false);
  const close = () => { if (view?.blob) URL.revokeObjectURL(view.url); setView(null); };
  const open = async (r, from = 'rep') => {
    if (view?.blob) URL.revokeObjectURL(view.url);
    const raw = String(r.url || '');
    // مسار API محمي (مثل /api/doctor/patients/..): لا يُفتح مباشرة لأنه يحتاج تسجيل الدخول وعنوان الخادم
    if (!USE_MOCK && /^\/(?!\/)/.test(raw)) {
      setLoading(true);
      try { setView({ ...r, from, url: await fetchProtectedBlobUrl(raw), blob: true }); }
      catch { setView({ ...r, from, url: '', error: true }); }
      finally { setLoading(false); }
      return;
    }
    const u = safeUrl(raw);
    if (u) setView({ ...r, from, url: u }); else setView({ ...r, from, url: '', demo: true });
  };
  const viewer = view && (
          <div className="viewer">
            <div className="viewer-h"><b dir="ltr">{view.name}</b><button type="button" className="icon-btn" onClick={close} aria-label={t('close')}><Icon name="x" size={18} /></button></div>
            {view.error ? <div className="state">{t('error')}</div> : view.demo ? <div className="state">{t('fv_demo')}</div> : view.type === 'pdf' ? <iframe src={view.url} title={view.name} /> : <img src={view.url} alt={view.name} />}
          </div>
  );

  return (
    <div className="fv">
      <div className="card">
        <h2>{t('fv_personal')} <span className="badge mu">{t('fv_readonly')}</span></h2>
        <div className="info-grid">
          <div className="row"><span className="m">{t('name')}</span><b>{L(file.name)}</b></div>
          <div className="row"><span className="m">{t('fv_birth')}</span><b>{i.birthDate ? fmtDate(i.birthDate) : '—'}</b></div>
          <div className="row"><span className="m">{t('fv_age')}</span><b>{i.age != null ? t('fv_years', { n: num(i.age) }) : '—'}</b></div>
          <div className="row"><span className="m">{t('fv_blood')}</span><b dir="ltr">{i.blood || '—'}</b></div>
          <div className="row"><span className="m">{t('fv_hw')}</span><b>{i.height ? `${num(i.height)} ${t('fv_cm')} / ${num(i.weight)} ${t('fv_kg')}` : '—'}</b></div>
        </div>
        <label>{t('fv_chronic')}</label>
        <div className="chips">{file.chronic.length ? file.chronic.map((c, k) => <span key={k} className="badge">{L(c)}</span>) : <span className="sub" style={{ margin: 0 }}>{t('fv_none')}</span>}</div>
      </div>

      <div className="card" style={{ marginTop: 16 }}>
        <h2>{t('fv_history')}</h2>
        <div className="scroll"><table>
          <thead><tr><th>{t('fv_cond')}</th><th>{t('fv_date')}</th><th>{t('fv_notes')}</th></tr></thead>
          <tbody>{file.history.length === 0 ? <tr><td colSpan={3} className="sub">{t('fv_none')}</td></tr> : file.history.map((h) => (
            <tr key={h.id}><td><b>{L(h.condition)}</b></td><td>{h.date ? fmtDate(h.date) : '—'}</td><td>{L(h.notes)}</td></tr>
          ))}</tbody>
        </table></div>
      </div>

      <div className="card" style={{ marginTop: 16 }}>
        <h2>{t('fv_rx')}</h2>
        {file.prescriptions.length === 0 ? <div className="state">{t('fv_no_rx')}</div> : <div className="rx-grid">{file.prescriptions.map((rx) => <RxCard key={rx.id} rx={rx} />)}</div>}
      </div>

      <div className="card" style={{ marginTop: 16 }}>
        <h2>{t('fv_results')}</h2>
        {file.results.length === 0 ? <div className="state">{t('fv_no_results')}</div> : file.results.map((r) => (
          <div className="row" key={r.id}>
            <div className="res-icon"><Icon name={ICON[r.kind] || 'file'} size={22} /></div>
            <div className="m"><b>{L(r.title)}</b><small>{L(r.source)} · {fmtDate(r.date)}</small></div>
            <span className={`badge ${TONE[r.status] || ''}`}>{r.status}</span>
            {r.url && <button type="button" className="btn s o" onClick={() => open(r, 'res')} disabled={loading}><Icon name="eye" size={15} />{t('fv_view')}</button>}
          </div>
        ))}
        {view?.from === 'res' && viewer}
      </div>

      <div className="card" style={{ marginTop: 16 }}>
        <h2>{t('fv_reports')}</h2>
        {file.reports.length === 0 ? <div className="state">{t('fv_no_reports')}</div> : (
          <div className="scroll"><table>
            <thead><tr><th>{t('fv_file')}</th><th>{t('fv_date')}</th><th /></tr></thead>
            <tbody>{file.reports.map((r) => (
              <tr key={r.id}><td><span className="file-chip"><Icon name="file" size={18} /><b dir="ltr">{r.name}</b></span></td><td>{fmtDate(r.date)}</td>
                <td><button type="button" className="btn s o" onClick={() => open(r)} disabled={loading}><Icon name="eye" size={15} />{t('fv_view')}</button></td></tr>
            ))}</tbody>
          </table></div>
        )}
        {view?.from !== 'res' && viewer}
      </div>
    </div>
  );
}
