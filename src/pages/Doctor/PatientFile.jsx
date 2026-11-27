import { useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Icon from '../../components/Icon.jsx';
import FileView from '../../components/shell/FileView.jsx';
import { Async } from '../../components/ui/States.jsx';
import { useAsync } from '../../components/ui/hooks.js';
import { useI18n } from '../../context/I18nContext.jsx';
import * as api from '../../api/doctor.js';

// قائمة المرضى (بحث سريع بالاسم) على جنب، وملف المريض المختار كامل في الباقي
export default function PatientFile() {
  const { t, L, num } = useI18n();
  const nav = useNavigate();
  const [params, setParams] = useSearchParams();
  const id = params.get('p') || '';
  const [q, setQ] = useState('');
  const pts = useAsync(() => api.getPatients(), []);
  const file = useAsync(() => (id ? api.getPatientFile(id) : Promise.resolve(null)), [id]);

  const refresh = async () => file.setData(await api.getPatientFile(id));
  const wrap = (fn) => async (...a) => { const r = await fn(id, ...a); await refresh(); return r; };
  const edit = {
    addHistory: wrap(api.addPatientHistory), updateHistory: wrap(api.updatePatientHistory), delHistory: wrap(api.delPatientHistory),
    addReports: wrap(api.addPatientReports), delReport: wrap(api.delPatientReport),
    addResult: wrap(api.addPatientResult), updateResult: wrap(api.updatePatientResult), delResult: wrap(api.delPatientResult),
  };

  const sorted = useMemo(() => [...(pts.data || [])].sort((a, b) => L(a.name).localeCompare(L(b.name), 'ar')), [pts.data, L]);
  const shown = useMemo(() => {
    const k = q.trim().toLowerCase();
    return k ? sorted.filter((p) => L(p.name).toLowerCase().includes(k)) : sorted;
  }, [sorted, q, L]);

  return (
    <section>
      <div className="page-head">
        <div><h1>{t('rec_title')}</h1><p className="sub">{t('rec_sub')}</p></div>
        {id && <button type="button" className="btn" onClick={() => nav(`/doctor/exam?p=${id}`)}><Icon name="clipboardPlus" size={18} />{t('add_rx')}</button>}
      </div>

      <Async state={pts}>{(list) => (list.length === 0 ? <div className="card state">{t('no_patients')}<br /><small>{t('no_patients_hint')}</small></div> : (
        <div className="pf-layout">
          <aside className="card pf-side">
            <div className="search">
              <Icon name="search" size={18} />
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t('pf_search')} aria-label={t('pf_search')} />
            </div>
            <small className="pf-count">{num(shown.length)} {t('pf_count')}</small>
            <div className="pf-list" role="listbox">
              {shown.length === 0 ? <div className="state">{t('pf_none')}</div> : shown.map((p) => (
                <button type="button" role="option" aria-selected={id === p.id} key={p.id} className={`pf-item ${id === p.id ? 'on' : ''}`} onClick={() => setParams({ p: p.id })}>
                  <span className="av">{L(p.name).charAt(0)}</span>
                  <span className="m"><b>{L(p.name)}</b><small>{p.age != null ? `${num(p.age)} ${t('years')}` : ''}</small></span>
                </button>
              ))}
            </div>
          </aside>

          <div className="pf-main">
            {!id ? <div className="card state">{t('pf_pick')}</div>
              : file.error ? <div className="card state err">{t(`err_${file.error.code}`) !== `err_${file.error.code}` ? t(`err_${file.error.code}`) : t('error')}</div>
                : <Async state={file}>{(f) => (f ? <FileView key={f.id} file={f} onSave={async (d) => { await api.updatePatientProfile(id, d); await refresh(); }} edit={edit} onEditRx={async (rid, d) => { await api.updatePrescription(id, rid, d); await refresh(); return true; }} /> : null)}</Async>}
          </div>
        </div>
      ))}</Async>
    </section>
  );
}
