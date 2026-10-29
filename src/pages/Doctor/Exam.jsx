import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { X } from 'lucide-react';
import { useDoctor } from '../../context/DoctorContext.jsx';
import { patients, defaultTests } from '../../data/doctorData.js';
import DrugPicker from '../../components/Doctor/DrugPicker.jsx';

const STORE = 'doctor-custom-tests';
const loadCustom = () => {
  try {
    return JSON.parse(localStorage.getItem(STORE)) || [];
  } catch {
    return [];
  }
};

export default function Exam() {
  const { t, toast } = useDoctor();
  const [params, setParams] = useSearchParams();
  const patientId = params.get('p') || String(patients[0]?.id ?? '');

  const [dx, setDx] = useState('');
  const [drug, setDrug] = useState(null);
  const [dose, setDose] = useState('');
  const [meds, setMeds] = useState([]);

  const [custom, setCustom] = useState(loadCustom);
  const [picked, setPicked] = useState([]);
  const [newTest, setNewTest] = useState('');

  useEffect(() => {
    try {
      localStorage.setItem(STORE, JSON.stringify(custom));
    } catch {
      /* storage unavailable */
    }
  }, [custom]);

  const allTests = [...defaultTests, ...custom];

  const addMed = () => {
    if (!drug) return toast(t('pick_drug'));
    setMeds((m) => [...m, { name: drug.commercial_name_en, sci: drug.scientific_name, dose: dose.trim() || '—' }]);
    setDrug(null);
    setDose('');
  };

  const toggleTest = (name) =>
    setPicked((p) => (p.includes(name) ? p.filter((x) => x !== name) : [...p, name]));

  const addTest = () => {
    const name = newTest.trim();
    if (!name) return;
    const existing = allTests.find((x) => x.toLowerCase() === name.toLowerCase());
    if (existing) {
      setPicked((p) => (p.includes(existing) ? p : [...p, existing]));
      toast(t('test_exists'));
    } else {
      setCustom((c) => [...c, name]);
      setPicked((p) => [...p, name]);
      toast(t('test_added'));
    }
    setNewTest('');
  };

  const removeCustom = (name) => {
    setCustom((c) => c.filter((x) => x !== name));
    setPicked((p) => p.filter((x) => x !== name));
  };

  const save = () => {
    if (!dx.trim()) return toast(t('enter_dx'));
    // TODO: أرسل (patientId, dx, meds, picked) إلى الـ API
    setDx('');
    setMeds([]);
    setPicked([]);
    toast(t('saved_exam'));
  };

  return (
    <section>
      <h1>{t('exam_title')}</h1>
      <p className="d-sub">{t('exam_sub')}</p>

      <div className="d-grid d-g2">
        <div className="d-card">
          <label className="first">{t('patient')}</label>
          <select value={patientId} onChange={(e) => setParams({ p: e.target.value })}>
            {patients.map((x) => (
              <option key={x.id} value={x.id}>{x.n}</option>
            ))}
          </select>

          <label>{t('diagnosis')}</label>
          <textarea rows={3} value={dx} onChange={(e) => setDx(e.target.value)} placeholder={t('dx_ph')} />

          <label>{t('prescription')}</label>
          <DrugPicker selected={drug} onSelect={setDrug} />
          <div className="d-inline" style={{ marginTop: 8 }}>
            <input value={dose} onChange={(e) => setDose(e.target.value)} placeholder={t('dose_ph')} />
            <button className="d-btn o" onClick={addMed}>{t('add_drug')}</button>
          </div>

          <div style={{ marginTop: 6 }}>
            {meds.map((m, i) => (
              <div className="d-row" key={i}>
                <div className="d-m">
                  <b dir="ltr" style={{ display: 'block', textAlign: 'start' }}>{m.name}</b>
                  <small>{m.dose}</small>
                </div>
                <button className="d-btn dg s" onClick={() => setMeds((x) => x.filter((_, j) => j !== i))}>{t('remove')}</button>
              </div>
            ))}
          </div>
        </div>

        <div className="d-card">
          <h2>{t('tests_title')}</h2>
          <div className="d-chips">
            {allTests.map((name) => {
              const isCustom = custom.includes(name);
              return (
                <span key={name} className={`d-chip-wrap ${picked.includes(name) ? 'on' : ''}`}>
                  <button className="d-chip-btn" onClick={() => toggleTest(name)}>{name}</button>
                  {isCustom && (
                    <button className="d-chip-x" onClick={() => removeCustom(name)} aria-label={t('remove')}>
                      <X size={13} />
                    </button>
                  )}
                </span>
              );
            })}
          </div>

          <div className="d-inline" style={{ marginTop: 14 }}>
            <input
              value={newTest}
              onChange={(e) => setNewTest(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addTest()}
              placeholder={t('new_test_ph')}
            />
            <button className="d-btn o" onClick={addTest}>{t('add_test')}</button>
          </div>

          <br />
          <button className="d-btn" onClick={save}>{t('save_exam')}</button>
        </div>
      </div>
    </section>
  );
}
