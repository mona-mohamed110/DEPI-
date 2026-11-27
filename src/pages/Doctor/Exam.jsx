
import { useEffect, useState } from 'react';
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
import * as shared from '../../api/shared.js';

export default function Exam() {
  const { t, L, lang, fmtDate } = useI18n();
  const { act, toast } = useToast();
  const [params, setParams] = useSearchParams();

  const pts = useAsync(() => api.getPatients(true), []);
  const me = useAsync(() => shared.getMe(), []);
  const queueOnly = !!me.data?.queueOnly;
  // لما الخيار مفعّل: القائمة بتتحدّث لوحدها عشان تظهر حركة الاستقبال
  useEffect(() => {
    if (!queueOnly) return undefined;
    const h = setInterval(() => pts.reload && pts.reload(), 20000);
    return () => clearInterval(h);
  }, [queueOnly]); // eslint-disable-line react-hooks/exhaustive-deps
  const tests = useAsync(() => api.getTests(), []);
  const prof = useAsync(() => api.getProfessional(), []);
  const [followDays, setFollowDays] = useState('');
  const [graceDays, setGraceDays] = useState('');

  const [dx, setDx] = useState('');
  const [drug, setDrug] = useState(null);
  const [dose, setDose] = useState('');
  const [duration, setDuration] = useState('');
  const [visit, setVisit] = useState('new');
  const [confirming, setConfirming] = useState(false);
  const [meds, setMeds] = useState([]);
  const [picked, setPicked] = useState([]);
  const [newTest, setNewTest] = useState('');
  const [busy, setBusy] = useState(false);

  // القيمة المبدئية من المدة الافتراضية للطبيب، ويعدلها لكل مريض
  useEffect(() => { if (prof.data && followDays === '') setFollowDays(String(prof.data.followUpDays || 14)); }, [prof.data]); // eslint-disable-line react-hooks/exhaustive-deps

  const custom = tests.data?.custom || [];

  const all = [
    ...TEST_CATALOG.map((c) => ({
      key: c.ar,
      label: lang === 'ar' ? c.ar : c.en,
      names: [c.ar, c.en],
      custom: false,
    })),
    ...custom.map((c) => ({
      key: c,
      label: c,
      names: [c],
      custom: true,
    })),
  ];

  const toggle = (k) =>
    setPicked((p) =>
      p.includes(k) ? p.filter((x) => x !== k) : [...p, k]
    );

  const addMed = () => {
    if (!drug) return toast(t('pick_drug'));

    setMeds((m) => [
      ...m,
      {
        name: drug.commercial_name_en,
        sci: drug.scientific_name,
        dose: dose.trim() || '—',
        duration: duration.trim() || '—',
      },
    ]);

    setDrug(null);
    setDose('');
    setDuration('');
  };

  const addTest = async () => {
    const name = newTest.trim();
    if (!name) return;

    const ex = all.find((x) =>
      x.names.some((n) => n.toLowerCase() === name.toLowerCase())
    );

    if (ex) {
      setPicked((p) => (p.includes(ex.key) ? p : [...p, ex.key]));
      toast(t('test_exists'));
    } else {
      const list = await act(() => api.addTest(name), 'test_added');

      if (list) {
        tests.setData((d) => ({ ...d, custom: list }));
        setPicked((p) => [...p, name]);
      }
    }

    setNewTest('');
  };

  const removeCustom = async (name) => {
    const list = await act(() => api.removeTest(name));

    if (list) {
      tests.setData((d) => ({ ...d, custom: list }));
      setPicked((p) => p.filter((x) => x !== name));
    }
  };

  const askSave = () => {
    if (!dx.trim()) return toast(t('enter_dx'));
    if (!meds.length && !picked.length) return toast(t('exam_need'));

    setConfirming(true);
  };

  // Save prescription using the selected patient's active booking
  const save = async (patient) => {
    const bookingId = patient?.activeBooking?.id;

    if (!patient?.id || !bookingId) {
      toast('لا يوجد حجز صالح لهذا المريض');
      return;
    }

    setBusy(true);

    const r = await act(
      () =>
        api.saveExam({
          patientId: patient.id,
          bookingId,
          diagnosis: dx,
          visit,
          meds: meds.map(({ name, dose, duration: du }) => ({
            name,
            dose,
            duration: du,
          })),
          tests: picked,
          followUpDays: followDays === '' ? undefined : Number(followDays),
          graceDays: graceDays === '' ? undefined : Number(graceDays),
        }),
      'saved_exam'
    );

    setBusy(false);
    setConfirming(false);

    if (r) {
      setDx('');
      setMeds([]);
      setPicked([]);
      setVisit('new');
      setGraceDays('');
      setFollowDays(String(prof.data?.followUpDays || 14));
    }
  };

  return (
    <section>
      <h1>{t('exam_title')}</h1>
      <p className="sub">{t('exam_sub')}</p>

      <Async state={pts}>
        {(list) => {
          // Only patients who have a valid booking
          // حجوزات اليوم فقط (بتوقيت القاهرة)، مرتبة بالوقت
          const todayStr = new Date().toLocaleDateString('en-CA', { timeZone: 'Africa/Cairo' });
          const eligiblePatients = list
            .flatMap((p) =>
              (p.activeBookings?.length ? p.activeBookings : p.activeBooking ? [p.activeBooking] : []).map((b) => ({ ...p, activeBooking: b }))
            )
            .filter((p) => queueOnly || p.activeBooking.date === todayStr)
            .sort((a, b) => String(a.activeBooking.date + (a.activeBooking.time || '')).localeCompare(String(b.activeBooking.date + (b.activeBooking.time || ''))));

          if (!eligiblePatients.length) {
            return (
              <div className="card state">
                {queueOnly ? 'لا يوجد مريض في الكشف الآن. سيظهر هنا عندما يدخله موظف الاستقبال.' : 'لا توجد حجوزات لليوم لكتابة روشتة.'}
              </div>
            );
          }

          // Keep the patient and booking from the URL when valid.
          // Otherwise use the first patient with an active booking.
          const requestedPatientId = params.get('p');
          const requestedBookingId = params.get('booking');

          const selectedPatient =
            eligiblePatients.find(
              (p) =>
                p.id === requestedPatientId &&
                (!requestedBookingId ||
                  p.activeBooking.id === requestedBookingId)
            ) ||
            eligiblePatients.find(
              (p) => p.activeBooking.id === requestedBookingId
            ) ||
            eligiblePatients.find(
              (p) => p.id === requestedPatientId
            ) ||
            eligiblePatients[0];

          return (
            <div className="grid g2">
              <div className="card">
                <label className="first">{t('patient')}</label>

                <select
                  value={selectedPatient.activeBooking.id}
                  onChange={(e) => {
                    const patient = eligiblePatients.find(
                      (p) => p.activeBooking.id === e.target.value
                    );

                    if (!patient) return;

                    setParams({
                      p: patient.id,
                      booking: patient.activeBooking.id,
                    });

                    setConfirming(false);
                  }}
                >
                  {eligiblePatients.map((x) => (
                    <option key={x.activeBooking.id} value={x.activeBooking.id}>
                      {L(x.name)}{x.activeBooking.time ? ` — ${x.activeBooking.time}` : ''}
                    </option>
                  ))}
                </select>

                <label>{t('visit_type')}</label>

                <div className="chips">
                  {VISIT_TYPES.map((v) => (
                    <button
                      type="button"
                      key={v}
                      className={`chip ${visit === v ? 'on' : ''}`}
                      onClick={() => setVisit(v)}
                    >
                      {t(`visit_${v}`)}
                    </button>
                  ))}
                </div>

                <div className="inline">
                  <div>
                    <label>{t('rx_follow_days')}</label>
                    <input type="number" min="1" max="365" dir="ltr" value={followDays} onChange={(e) => setFollowDays(e.target.value)} />
                  </div>
                  <div>
                    <label>{t('rx_grace_days')}</label>
                    <input type="number" min="0" max="60" dir="ltr" value={graceDays} onChange={(e) => setGraceDays(e.target.value)} placeholder={t('rx_optional')} />
                  </div>
                </div>
                <p className="sub" style={{ margin: '4px 0 0', fontSize: 13 }}>{t('rx_follow_hint')}</p>

                <label>{t('diagnosis')}</label>

                <textarea
                  rows={3}
                  maxLength={1000}
                  value={dx}
                  onChange={(e) => setDx(e.target.value)}
                  placeholder={t('dx_ph')}
                />

                <label>{t('prescription')}</label>

                <DrugPicker selected={drug} onSelect={setDrug} />

                <div className="inline" style={{ marginTop: 8 }}>
                  <input
                    value={dose}
                    onChange={(e) => setDose(e.target.value)}
                    placeholder={t('dose_ph')}
                  />

                  <input
                    value={duration}
                    maxLength={60}
                    onChange={(e) => setDuration(e.target.value)}
                    placeholder={t('duration_ph')}
                  />

                  <button
                    type="button"
                    className="btn o"
                    onClick={addMed}
                  >
                    <Icon name="plusSm" size={16} />
                    {t('add_drug')}
                  </button>
                </div>

                <div style={{ marginTop: 6 }}>
                  {meds.map((m, i) => (
                    <div className="med-line" key={i}>
                      <div className="m">
                        <b
                          dir="ltr"
                          style={{
                            display: 'block',
                            textAlign: 'start',
                          }}
                        >
                          {m.name}
                        </b>

                        <small>
                          {t('rx_dose')}: {m.dose} ·{' '}
                          {t('rx_duration')}: {m.duration}
                        </small>
                      </div>

                      <button
                        type="button"
                        className="btn s o dg"
                        onClick={() =>
                          setMeds((x) =>
                            x.filter((_, j) => j !== i)
                          )
                        }
                      >
                        {t('remove')}
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="card">
                <h2>{t('tests_title')}</h2>

                <Async state={tests}>
                  {() => (
                    <div className="chips">
                      {all.map((x) => (
                        <span
                          key={x.key}
                          className="inline"
                          style={{ gap: 2 }}
                        >
                          <button
                            type="button"
                            className={`chip ${
                              picked.includes(x.key) ? 'on' : ''
                            }`}
                            onClick={() => toggle(x.key)}
                          >
                            {x.label}
                          </button>

                          {x.custom && (
                            <button
                              type="button"
                              className="icon-btn"
                              onClick={() => removeCustom(x.key)}
                              aria-label={t('remove')}
                            >
                              <Icon name="x" size={14} />
                            </button>
                          )}
                        </span>
                      ))}
                    </div>
                  )}
                </Async>

                <div className="inline" style={{ marginTop: 14 }}>
                  <input
                    value={newTest}
                    maxLength={60}
                    onChange={(e) => setNewTest(e.target.value)}
                    onKeyDown={(e) =>
                      e.key === 'Enter' && addTest()
                    }
                    placeholder={t('new_test_ph')}
                  />

                  <button
                    type="button"
                    className="btn o"
                    onClick={addTest}
                  >
                    <Icon name="plusSm" size={16} />
                    {t('add_test')}
                  </button>
                </div>

                <div className="btn-row">
                  <button
                    type="button"
                    className="btn"
                    disabled={busy || confirming}
                    onClick={askSave}
                  >
                    {busy ? t('loading') : t('save_exam')}
                  </button>
                </div>

                {confirming && (
                  <ConfirmForm
                    danger={false}
                    message={t('exam_confirm_msg')}
                    confirmLabel={t('exam_send')}
                    cancelLabel={t('exam_edit')}
                    busy={busy}
                    onConfirm={() => save(selectedPatient)}
                    onCancel={() => setConfirming(false)}
                  />
                )}
              </div>
            </div>
          );
        }}
      </Async>
    </section>
  );
}
