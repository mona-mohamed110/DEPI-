import { useState } from 'react';
import { BLOOD_TYPES, CHRONIC, TEST_CATALOG } from '../../config/catalog.js';
import { useToast } from '../ui/Toast.jsx';
import Icon from '../Icon.jsx';
import RxCard from './RxCard.jsx';
import DrugPicker from '../../pages/Doctor/DrugPicker.jsx';
import { useI18n } from '../../context/I18nContext.jsx';
import { safeUrl } from '../../api/security.js';
import { fetchProtectedBlobUrl } from '../../api/http.js';
import { USE_MOCK } from '../../config/env.js';

const ICON = { lab: 'tube', xray: 'scan', ecg: 'activity' };
const TONE = { normal: 'ok', low: 'wn', followup: 'dg' };

// عرض الملف الطبي بالكامل للقراءة فقط (من غير أي خانات تعديل أو إضافة) — بيستخدمه الدكتور
export default function FileView({ file, onSave, edit, onEditRx }) {
  const { t, L, num, fmtDate, lang } = useI18n();
  const { act } = useToast();
  const [f, setF] = useState(null);
  const startEdit = () => setF({ birthDate: file.info?.birthDate || '', blood: file.info?.blood || '', height: file.info?.height || '', weight: file.info?.weight || '', chronicIds: file.chronicIds || [], chronicOther: (file.chronicOther || []).join('، ') });
  const toggle = (id) => setF((x) => ({ ...x, chronicIds: x.chronicIds.includes(id) ? x.chronicIds.filter((c) => c !== id) : [...x.chronicIds, id] }));
  const can = !!(file.editable && edit);
  // تعديل آخر روشتة كتبها الطبيب
  const [xf, setXf] = useState(null);
  const [newTest, setNewTest] = useState('');
  const [nd, setNd] = useState({ drug: null, dose: '', duration: '' });
  const addDrug = () => {
    if (!nd.drug || !nd.dose.trim() || !nd.duration.trim()) return act(() => Promise.reject(Object.assign(new Error('x'), { code: 'invalid_data' })));
    setXf((x) => ({ ...x, items: [...x.items, { name: nd.drug.commercial_name_en, dose: nd.dose.trim(), duration: nd.duration.trim() }] }));
    setNd({ drug: null, dose: '', duration: '' });
  };
  const latestRx = file.prescriptions.find((r) => r.editable);
  const startRx = (rx) => setXf({ id: rx.id, diagnosis: rx.diagnosis || '', items: (rx.items || []).map((m) => ({ ...m })), tests: (rx.tests || []).map((x) => ({ ...x })), followUpDays: rx.followUpDays || '', graceDays: rx.graceDays || '' });
  const setItem = (i, k, v) => setXf((x) => ({ ...x, items: x.items.map((m, j) => (j === i ? { ...m, [k]: v } : m)) }));
  const addTest = () => {
    const name = newTest.trim();
    if (!name || xf.tests.some((x) => x.name === name)) return setNewTest('');
    const c = TEST_CATALOG.find((x) => x.ar === name || x.en === name);
    setXf((x) => ({ ...x, tests: [...x.tests, { name: c ? c.ar : name, kind: c ? c.kind : 'lab' }] }));
    setNewTest('');
  };
  const saveRx = async (e) => {
    e.preventDefault();
    if (!xf.items.length || xf.items.some((m) => !m.name.trim() || !m.dose.trim() || !m.duration.trim())) return act(() => Promise.reject(Object.assign(new Error('x'), { code: 'invalid_data' })));
    const r = await act(() => onEditRx(xf.id, { diagnosis: xf.diagnosis, items: xf.items, tests: xf.tests, followUpDays: xf.followUpDays, graceDays: xf.graceDays }), 'fv_saved');
    if (r) setXf(null);
  };
  const [hf, setHf] = useState(null);      // نموذج التاريخ المرضي
  const [rf, setRf] = useState(null);      // نموذج نتيجة تحليل/أشعة
  const [busy, setBusy] = useState(false);
  const run = async (fn, ok = 'saved') => { setBusy(true); try { return await act(fn, ok); } finally { setBusy(false); } };
  const sure = () => window.confirm(t('fv_confirm_del'));
  const saveHist = async (e) => { e.preventDefault(); if (!hf.condition.trim()) return; const d = { condition: hf.condition, date: hf.date, notes: hf.notes }; const r = await run(() => (hf.id ? edit.updateHistory(hf.id, d) : edit.addHistory(d))); if (r !== undefined && r !== null) setHf(null); };
  const saveRes = async (e) => { e.preventDefault(); if (!rf.title.trim()) return; const d = { title: rf.title, kind: rf.kind, status: rf.status }; const r = await run(() => (rf.id ? edit.updateResult(rf.id, d) : (rf.file ? edit.addResult([rf.file], d) : Promise.reject(Object.assign(new Error('x'), { code: 'invalid_data' }))))); if (r !== undefined && r !== null) setRf(null); };
  const addReport = async (e) => { const fl = [...(e.target.files || [])]; e.target.value = ''; if (fl.length) await run(() => edit.addReports(fl)); };
  const save = async (e) => {
    e.preventDefault();
    const r = await act(() => onSave(f), 'fv_saved');
    if (r) setF(null);
  };
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
        <h2>{t('fv_personal')} {file.editable && onSave ? <span className="badge">{t('fv_edit_hint')}</span> : <span className="badge mu">{t('fv_readonly')}</span>}</h2>
        {f && file.editable && onSave ? (
          <form onSubmit={save}>
            <div className="info-grid">
              <div><label>{t('fv_birth')}</label><input type="date" max={new Date().toISOString().slice(0, 10)} value={f.birthDate} onChange={(e) => setF({ ...f, birthDate: e.target.value })} /></div>
              <div><label>{t('fv_blood')}</label><select value={f.blood} onChange={(e) => setF({ ...f, blood: e.target.value })}><option value="">—</option>{BLOOD_TYPES.map((b) => <option key={b}>{b}</option>)}</select></div>
              <div><label>{t('fv_cm')}</label><input inputMode="numeric" value={f.height} onChange={(e) => setF({ ...f, height: e.target.value })} /></div>
              <div><label>{t('fv_kg')}</label><input inputMode="numeric" value={f.weight} onChange={(e) => setF({ ...f, weight: e.target.value })} /></div>
            </div>
            <label>{t('fv_chronic')}</label>
            <div className="chips">{CHRONIC.map((c) => <button type="button" key={c.id} className={`chip ${f.chronicIds.includes(c.id) ? 'on' : ''}`} aria-pressed={f.chronicIds.includes(c.id)} onClick={() => toggle(c.id)}>{lang === 'ar' ? c.ar : c.en}</button>)}</div>
            <label>{t('rg_chronic_other')}</label>
            <input value={f.chronicOther} maxLength={300} onChange={(e) => setF({ ...f, chronicOther: e.target.value })} placeholder={t('rg_chronic_other_ph')} />
            <div className="btn-row"><button className="btn" type="submit">{t('fv_save')}</button><button type="button" className="btn o" onClick={() => setF(null)}>{t('fv_cancel')}</button></div>
          </form>
        ) : (<>
        <div className="info-grid">
          <div className="row"><span className="m">{t('name')}</span><b>{L(file.name)}</b></div>
          <div className="row"><span className="m">{t('fv_birth')}</span><b>{i.birthDate ? fmtDate(i.birthDate) : '—'}</b></div>
          <div className="row"><span className="m">{t('fv_age')}</span><b>{i.age != null ? t('fv_years', { n: num(i.age) }) : '—'}</b></div>
          <div className="row"><span className="m">{t('fv_blood')}</span><b dir="ltr">{i.blood || '—'}</b></div>
          <div className="row"><span className="m">{t('fv_hw')}</span><b>{i.height ? `${num(i.height)} ${t('fv_cm')} / ${num(i.weight)} ${t('fv_kg')}` : '—'}</b></div>
        </div>
        <label>{t('fv_chronic')}</label>
        <div className="chips">{file.chronic.length ? file.chronic.map((c, k) => <span key={k} className="badge">{L(c)}</span>) : <span className="sub" style={{ margin: 0 }}>{t('fv_none')}</span>}</div>
        {file.editable && onSave && <div className="btn-row"><button type="button" className="btn" onClick={startEdit}>{t('fv_edit')}</button></div>}
        </>)}
      </div>

      <div className="card" style={{ marginTop: 16 }}>
        <h2>{t('fv_history')}</h2>
        <div className="scroll"><table>
          <thead><tr><th>{t('fv_cond')}</th><th>{t('fv_date')}</th><th>{t('fv_notes')}</th>{can && <th />}</tr></thead>
          <tbody>{file.history.length === 0 ? <tr><td colSpan={can ? 4 : 3} className="sub">{t('fv_none')}</td></tr> : file.history.map((h) => (
            <tr key={h.id}><td><b>{L(h.condition)}</b></td><td>{h.date ? fmtDate(h.date) : '—'}</td><td>{L(h.notes)}</td>
              {can && <td style={{ whiteSpace: 'nowrap' }}>
                <button type="button" className="btn s o" disabled={busy} onClick={() => setHf({ id: h.id, condition: h.condition, date: h.date || '', notes: h.notes || '' })}>{t('fv_edit1')}</button>{' '}
                <button type="button" className="btn s o" disabled={busy} onClick={() => sure() && run(() => edit.delHistory(h.id))}>{t('fv_del')}</button>
              </td>}
            </tr>
          ))}</tbody>
        </table></div>
        {can && (hf ? (
          <form onSubmit={saveHist} style={{ marginTop: 12 }}>
            <div className="info-grid">
              <div><label>{t('fv_cond')}</label><input value={hf.condition} maxLength={200} placeholder={t('fv_cond_ph')} onChange={(e) => setHf({ ...hf, condition: e.target.value })} /></div>
              <div><label>{t('fv_date')}</label><input type="date" value={hf.date} onChange={(e) => setHf({ ...hf, date: e.target.value })} /></div>
            </div>
            <label>{t('fv_notes')}</label>
            <textarea rows={2} value={hf.notes} maxLength={1000} placeholder={t('fv_notes_ph')} onChange={(e) => setHf({ ...hf, notes: e.target.value })} />
            <div className="btn-row"><button className="btn" type="submit" disabled={busy}>{t('fv_save')}</button><button type="button" className="btn o" onClick={() => setHf(null)}>{t('fv_cancel')}</button></div>
          </form>
        ) : <div className="btn-row"><button type="button" className="btn" onClick={() => setHf({ id: '', condition: '', date: '', notes: '' })}>{t('fv_add')}</button></div>)}
      </div>

      <div className="card" style={{ marginTop: 16 }}>
        <h2 style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>{t('fv_rx')}{latestRx && onEditRx && !xf && <button type="button" className="btn s" onClick={() => startRx(latestRx)}><Icon name="edit" size={15} />{t('fv_edit_rx_title')}</button>}</h2>
        {file.prescriptions.length === 0 ? <div className="state">{t('fv_no_rx')}</div> : <div className="rx-grid">{file.prescriptions.map((rx) => <RxCard key={rx.id} rx={rx}>{rx.editable && onEditRx && <button type="button" className="btn s o" onClick={() => startRx(rx)}>{t('fv_edit_rx')}</button>}</RxCard>)}</div>}
        {xf && onEditRx && (
          <form onSubmit={saveRx} className="rx-edit">
            <h3>{t('fv_edit_rx_title')}</h3>
            <label>{t('rx_diagnosis')}</label>
            <textarea rows={2} maxLength={500} value={xf.diagnosis} onChange={(e) => setXf({ ...xf, diagnosis: e.target.value })} />
            <label>{t('fv_meds')}</label>
            {xf.items.map((m, i) => (
              <div className="rx-edit-row" key={i}>
                <b className="rx-edit-name" dir="auto">{m.name}</b>
                <input value={m.dose} maxLength={120} placeholder={t('dose_ph')} onChange={(e) => setItem(i, 'dose', e.target.value)} />
                <input value={m.duration} maxLength={120} placeholder={t('duration_ph')} onChange={(e) => setItem(i, 'duration', e.target.value)} />
                <button type="button" className="btn s o" aria-label={t('fv_del')} onClick={() => setXf({ ...xf, items: xf.items.filter((_, j) => j !== i) })}>✕</button>
              </div>
            ))}
            <div className="rx-edit-add">
              <DrugPicker selected={nd.drug} onSelect={(d) => setNd((x) => ({ ...x, drug: d }))} />
              <div className="rx-edit-row">
                <input value={nd.dose} placeholder={t('dose_ph')} onChange={(e) => setNd({ ...nd, dose: e.target.value })} />
                <input value={nd.duration} placeholder={t('duration_ph')} onChange={(e) => setNd({ ...nd, duration: e.target.value })} />
                <button type="button" className="btn s" onClick={addDrug}>+ {t('fv_add_med')}</button>
              </div>
            </div>
            <label style={{ marginTop: 12 }}>{t('fv_tests_req')}</label>
            <div className="chips">
              {xf.tests.map((x) => <span key={x.name} className="badge">{x.name}<button type="button" className="chip-x" aria-label={t('fv_del')} onClick={() => setXf({ ...xf, tests: xf.tests.filter((y) => y.name !== x.name) })}>✕</button></span>)}
            </div>
            <div className="rx-edit-row">
              <input list="rx-test-list" value={newTest} placeholder={t('fv_add_test')} onChange={(e) => setNewTest(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addTest(); } }} />
              <datalist id="rx-test-list">{TEST_CATALOG.map((c) => <option key={c.ar} value={lang === 'ar' ? c.ar : c.en} />)}</datalist>
              <button type="button" className="btn s o" onClick={addTest}>{t('fv_add')}</button>
            </div>
            <div className="info-grid">
              <div><label>{t('fv_follow_days')}</label><input inputMode="numeric" value={xf.followUpDays} onChange={(e) => setXf({ ...xf, followUpDays: e.target.value.replace(/\D/g, '').slice(0, 3) })} /></div>
              <div><label>{t('fv_grace_days')}</label><input inputMode="numeric" value={xf.graceDays} onChange={(e) => setXf({ ...xf, graceDays: e.target.value.replace(/\D/g, '').slice(0, 2) })} /></div>
            </div>
            <div className="btn-row"><button className="btn" type="submit">{t('fv_save')}</button><button type="button" className="btn o" onClick={() => setXf(null)}>{t('fv_cancel')}</button></div>
          </form>
        )}
      </div>

      <div className="card" style={{ marginTop: 16 }}>
        <h2>{t('fv_results')}</h2>
        {file.results.length === 0 ? <div className="state">{t('fv_no_results')}</div> : file.results.map((r) => (
          <div className="row" key={r.id}>
            <div className="res-icon"><Icon name={ICON[r.kind] || 'file'} size={22} /></div>
            <div className="m"><b>{L(r.title)}</b><small>{L(r.source)} · {fmtDate(r.date)}</small></div>
            <span className={`badge ${TONE[r.status] || ''}`}>{t(`fv_st_${r.status}`) !== `fv_st_${r.status}` ? t(`fv_st_${r.status}`) : r.status}</span>
            {r.url && <button type="button" className="btn s o" onClick={() => open(r, 'res')} disabled={loading}><Icon name="eye" size={15} />{t('fv_view')}</button>}
            {can && r.byDoctor && <>
              <button type="button" className="btn s o" disabled={busy} onClick={() => setRf({ id: r.id, title: r.title, kind: r.kind, status: r.status, file: null })}>{t('fv_edit1')}</button>
              <button type="button" className="btn s o" disabled={busy} onClick={() => sure() && run(() => edit.delResult(r.id))}>{t('fv_del')}</button>
            </>}
          </div>
        ))}
        {view?.from === 'res' && viewer}
        {can && (rf ? (
          <form onSubmit={saveRes} style={{ marginTop: 12 }}>
            <div className="info-grid">
              <div><label>{t('fv_title')}</label><input value={rf.title} maxLength={120} onChange={(e) => setRf({ ...rf, title: e.target.value })} /></div>
              <div><label>{t('fv_kind')}</label><select value={rf.kind} onChange={(e) => setRf({ ...rf, kind: e.target.value })}>{['lab', 'xray', 'ecg', 'other'].map((k) => <option key={k} value={k}>{t(`fv_k_${k}`)}</option>)}</select></div>
              <div><label>{t('fv_st')}</label><select value={rf.status} onChange={(e) => setRf({ ...rf, status: e.target.value })}>{['normal', 'low', 'high', 'followup'].map((k) => <option key={k} value={k}>{t(`fv_st_${k}`)}</option>)}</select></div>
              {!rf.id && <div><label>{t('fv_file')}</label><input type="file" accept="image/*,application/pdf,.dcm" onChange={(e) => setRf({ ...rf, file: e.target.files?.[0] || null })} /></div>}
            </div>
            <div className="btn-row"><button className="btn" type="submit" disabled={busy}>{t('fv_save')}</button><button type="button" className="btn o" onClick={() => setRf(null)}>{t('fv_cancel')}</button></div>
          </form>
        ) : <div className="btn-row"><button type="button" className="btn" onClick={() => setRf({ id: '', title: '', kind: 'lab', status: 'normal', file: null })}>{t('fv_add')}</button></div>)}
      </div>

      <div className="card" style={{ marginTop: 16 }}>
        <h2>{t('fv_reports')}</h2>
        {file.reports.length === 0 ? <div className="state">{t('fv_no_reports')}</div> : (
          <div className="scroll"><table>
            <thead><tr><th>{t('fv_file')}</th><th>{t('fv_date')}</th><th /></tr></thead>
            <tbody>{file.reports.map((r) => (
              <tr key={r.id}><td><span className="file-chip"><Icon name="file" size={18} /><b dir="ltr">{r.name}</b></span></td><td>{fmtDate(r.date)}</td>
                <td><button type="button" className="btn s o" onClick={() => open(r)} disabled={loading}><Icon name="eye" size={15} />{t('fv_view')}</button>{can && <>{' '}<button type="button" className="btn s o" disabled={busy} onClick={() => sure() && run(() => edit.delReport(r.id))}>{t('fv_del')}</button></>}</td></tr>
            ))}</tbody>
          </table></div>
        )}
        {view?.from !== 'res' && viewer}
        {can && <div className="btn-row"><label className="btn" style={{ cursor: 'pointer' }}>{t('fv_add')}<input type="file" multiple hidden accept="image/*,application/pdf" onChange={addReport} /></label></div>}
      </div>
    </div>
  );
}
