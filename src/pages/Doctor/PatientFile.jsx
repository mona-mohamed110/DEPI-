import { useSearchParams } from 'react-router-dom';
import { useDoctor } from '../../context/DoctorContext.jsx';
import { patients } from '../../data/doctorData.js';

export default function PatientFile() {
  const { t } = useDoctor();
  const [params, setParams] = useSearchParams();
  const p = patients.find((x) => String(x.id) === params.get('p')) || patients[0];

  return (
    <section>
      <h1>{t('rec_title')}</h1>
      <p className="d-sub">{t('rec_sub')}</p>

      {!p ? (
        <div className="d-card">{t('no_patients')}</div>
      ) : (
        <>
          <div className="d-card" style={{ marginBottom: 14 }}>
            <select value={p.id} onChange={(e) => setParams({ p: e.target.value })}>
              {patients.map((x) => (
                <option key={x.id} value={x.id}>{x.n}</option>
              ))}
            </select>
          </div>

          <div className="d-note">{t('rec_note')} {p.exp}</div>
          <div className="d-grid d-g2">
            <div className="d-card">
              <h2>{t('data')}</h2>
              <div className="d-row"><span className="d-m">{t('name')}</span><b>{p.n}</b></div>
              <div className="d-row"><span className="d-m">{t('age')}</span><b>{p.age} {t('years')}</b></div>
              <div className="d-row"><span className="d-m">{t('chronic')}</span><b>{p.ch}</b></div>
              <div className="d-row"><span className="d-m">{t('allergy')}</span><b>{p.al}</b></div>
            </div>
            <div className="d-card">
              <h2>{t('current_meds')}</h2>
              <p>{p.rx}</p>
              <h2>{t('last_results')}</h2>
              <p>{p.res}</p>
            </div>
          </div>
        </>
      )}
    </section>
  );
}
