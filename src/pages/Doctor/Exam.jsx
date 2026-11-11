import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import Icon from '../../components/Icon.jsx';
import { Async } from '../../components/ui/States.jsx';
import { useAsync } from '../../components/ui/hooks.js';
import { useToast } from '../../components/ui/Toast.jsx';
import { useI18n } from '../../context/I18nContext.jsx';
import ConfirmForm from '../../components/ui/ConfirmForm.jsx';
import { TEST_CATALOG, VISIT_TYPES } from '../../config/catalog.js';
import DrugPicker from './DrugPicker.jsx';
import * as api from '../../api/doctor.js';

export default function Exam() {
  const { t, L, lang } = useI18n();
  const { act, toast } = useToast();
  const [params, setParams] = useSearchParams();
  const pts = useAsync(() => api.getPatients(), []);
  const tests = useAsync(() => api.getTests(), []);
  const [dx, setDx] = useState('');
  const [drug, setDrug] = useState(null);
  const [dose, setDose] = useState('');
  const [duration, setDuration] = useState('');
  const [visit, setVisit] = useState('new');
  const [confirming, setConfirming] = useState(false);
  const [meds, setMeds] = useState([]);
  const [picked, setPicked] = useState([]);      // أسماء الأنواع (بالعربي للكتالوج / كما كُتبت للمضاف)
  const [newTest, setNewTest] = useState('');
  const [busy, setBusy] = useState(false);

  const custom = tests.data?.custom || [];
  const all = [...TEST_CATALOG.map((c) => ({ key: c.ar, label: lang === 'ar' ? c.ar : c.en, names: [c.ar, c.en], custom: false })), ...custom.map((c) => ({ key: c, label: c, names: [c], custom: true }))];
  const toggle = (k) => setPicked((p) => (p.includes(k) ? p.filter((x) => x !== k) : [...p, k]));

  const addMed = () => {
    if (!drug) return toast(t('pick_drug'));
    setMeds((m) => [...m, { name: drug.commercial_name_en, sci: drug.scientific_name, dose: dose.trim() || '—', duration: duration.trim() || '—' }]);
    setDrug(null); setDose(''); setDuration('');
  };
  const addTest = async () => {
    const name = newTest.trim();
    if (!name) return;
    const ex = all.find((x) => x.names.some((n) => n.toLowerCase() === name.toLowerCase()));
    if (ex) { setPicked((p) => (p.includes(ex.key) ? p : [...p, ex.key])); toast(t('test_exists')); }
    else {
      const list = await act(() => api.addTest(name), 'test_added');
      if (list) { tests.setData((d) => ({ ...d, custom: list })); setPicked((p) => [...p, name]); }
    }
    setNewTest('');
  };
  const removeCustom = async (name) => {
    const list = await act(() => api.removeTest(name));
    if (list) { tests.setData((d) => ({ ...d, custom: list })); setPicked((p) => p.filter((x) => x !== name)); }
  };
  // الخطوة الأولى: فحص البيانات ثم رسالة التأكيد (إرسال / تعديل)
  const askSave = () => {
    if (!dx.trim()) return toast(t('enter_dx'));
    if (!meds.length && !picked.length) return toast(t('exam_need'));
    setConfirming(true);
  };
  const save = async (patientId) => {
    setBusy(true);
    const r = await act(() => api.saveExam({ patientId, diagnosis: dx, visit, meds: meds.map(({ name, dose, duration: du }) => ({ name, dose, duration: du })), tests: picked }), 'saved_exam');
    setBusy(false); setConfirming(false);
    if (r) { setDx(''); setMeds([]); setPicked([]); setVisit('new'); }
  };

  return (
    <section>
      <h1>{t('exam_title')}</h1>
      <p className="sub">{t('exam_sub')}</p>
      <Async state={pts}>{(list) => {
        const pid = params.get('p') || list[0]?.id || '';
        if (!list.length) return <div className="card state">{t('no_patients')}</div>;
        return (
          <div className="grid g2">
            <div className="card">
              <label className="first">{t('patient')}</label>
              <select value={pid} onChange={(e) => { setParams({ p: e.target.value }); setConfirming(false); }}>{list.map((x) => <option key={x.id} value={x.id}>{L(x.name)}</option>)}</select>
              <label>{t('visit_type')}</label>
              <div className="chips">{VISIT_TYPES.map((v) => <button type="button" key={v} className={`chip ${visit === v ? 'on' : ''}`} onClick={() => setVisit(v)}>{t(`visit_${v}`)}</button>)}</div>
              <label>{t('diagnosis')}</label>
              <textarea rows={3} maxLength={1000} value={dx} onChange={(e) => setDx(e.target.value)} placeholder={t('dx_ph')} />
              <label>{t('prescription')}</label>
              <DrugPicker selected={drug} onSelect={setDrug} />
              <div className="inline" style={{ marginTop: 8 }}>
                <input value={dose} onChange={(e) => setDose(e.target.value)} placeholder={t('dose_ph')} />
                <input value={duration} maxLength={60} onChange={(e) => setDuration(e.target.value)} placeholder={t('duration_ph')} />
                <button type="button" className="btn o" onClick={addMed}><Icon name="plusSm" size={16} />{t('add_drug')}</button>
              </div>
              <div style={{ marginTop: 6 }}>
                {meds.map((m, i) => (
                  <div className="med-line" key={i}>
                    <div className="m"><b dir="ltr" style={{ display: 'block', textAlign: 'start' }}>{m.name}</b><small>{t('rx_dose')}: {m.dose} · {t('rx_duration')}: {m.duration}</small></div>
                    <button type="button" className="btn s o dg" onClick={() => setMeds((x) => x.filter((_, j) => j !== i))}>{t('remove')}</button>
                  </div>
                ))}
              </div>
            </div>
            <div className="card">
              <h2>{t('tests_title')}</h2>
              <Async state={tests}>{() => (
                <div className="chips">
                  {all.map((x) => (
                    <span key={x.key} className="inline" style={{ gap: 2 }}>
                      <button type="button" className={`chip ${picked.includes(x.key) ? 'on' : ''}`} onClick={() => toggle(x.key)}>{x.label}</button>
                      {x.custom && <button type="button" className="icon-btn" onClick={() => removeCustom(x.key)} aria-label={t('remove')}><Icon name="x" size={14} /></button>}
                    </span>
                  ))}
                </div>
              )}</Async>
              <div className="inline" style={{ marginTop: 14 }}>
                <input value={newTest} maxLength={60} onChange={(e) => setNewTest(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && addTest()} placeholder={t('new_test_ph')} />
                <button type="button" className="btn o" onClick={addTest}><Icon name="plusSm" size={16} />{t('add_test')}</button>
              </div>
              <div className="btn-row"><button type="button" className="btn" disabled={busy || confirming} onClick={askSave}>{busy ? t('loading') : t('save_exam')}</button></div>
              {confirming && <ConfirmForm danger={false} message={t('exam_confirm_msg')} confirmLabel={t('exam_send')} cancelLabel={t('exam_edit')} busy={busy} onConfirm={() => save(pid)} onCancel={() => setConfirming(false)} />}
            </div>
          </div>
        );
      }}</Async>
    </section>
  );
}
