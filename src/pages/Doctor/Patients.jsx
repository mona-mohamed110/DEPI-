import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from '../../components/Icon.jsx';
import { Async } from '../../components/ui/States.jsx';
import { useAsync } from '../../components/ui/hooks.js';
import { useI18n } from '../../context/I18nContext.jsx';
import * as api from '../../api/doctor.js';

export default function Patients() {
  const { t, L, num, fmtDate } = useI18n();
  const nav = useNavigate();
  const [q, setQ] = useState('');
  const state = useAsync(() => api.getPatients(), []);
  return (
    <section>
      <h1>{t('patients_title')}</h1>
      <p className="sub">{t('patients_sub')}</p>
      <div className="card">
        <div className="search" style={{ marginBottom: 8 }}><Icon name="search" size={18} /><input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t('search_patient')} /></div>
        <Async state={state}>{(all) => {
          const list = all.filter((p) => L(p.name).toLowerCase().includes(q.trim().toLowerCase()));
          return list.length === 0 ? <div className="state">{all.length ? t('no_results') : <>{t('no_patients')}<br /><small>{t('no_patients_hint')}</small></>}</div> : list.map((p) => (
            <div className="row" key={p.id}>
              <div className="av">{L(p.name).charAt(0)}</div>
              <div className="m"><b>{L(p.name)}</b><small>{p.age != null ? `${num(p.age)} ${t('years')}` : '—'} · {p.chronic.length ? p.chronic.map(L).join('، ') : t('fv_none')}</small></div>
              <span className="badge ok">{t('perm_until')} {fmtDate(p.until)}</span>
              <button type="button" className="btn o s" onClick={() => nav(`/doctor/patient-file?p=${p.id}`)}>{t('btn_file')}</button>
              <button type="button" className="btn s" onClick={() => nav(`/doctor/exam?p=${p.id}`)}>{t('btn_exam')}</button>
            </div>
          ));
        }}</Async>
      </div>
    </section>
  );
}
