import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search } from 'lucide-react';
import { useDoctor } from '../../context/DoctorContext.jsx';
import { patients } from '../../data/doctorData.js';

export default function Patients() {
  const { t } = useDoctor();
  const navigate = useNavigate();
  const [q, setQ] = useState('');
  const list = patients.filter((p) => !q.trim() || p.n.includes(q.trim()));

  return (
    <section>
      <h1>{t('patients_title')}</h1>
      <p className="d-sub">{t('patients_sub')}</p>
      <div className="d-card">
        <div className="d-search" style={{ marginBottom: 8 }}>
          <Search size={17} />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t('search_patient')} />
        </div>
        {list.length === 0 && <p className="d-sub">{t('no_results')}</p>}
        {list.map((p) => (
          <div className="d-row" key={p.id}>
            <div className="d-av">{p.n.charAt(0)}</div>
            <div className="d-m">
              <b>{p.n}</b>
              <small>{p.age} {t('years')} · {p.ch}</small>
            </div>
            <span className="d-badge ok">{t('perm_until')} {p.exp}</span>
            <button className="d-btn o s" onClick={() => navigate(`/doctor/patient-file?p=${p.id}`)}>{t('btn_file')}</button>
            <button className="d-btn s" onClick={() => navigate(`/doctor/exam?p=${p.id}`)}>{t('btn_exam')}</button>
          </div>
        ))}
      </div>
    </section>
  );
}
