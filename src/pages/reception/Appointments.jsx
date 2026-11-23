import { useEffect, useMemo, useState } from 'react';
import Icon from '../../components/Icon.jsx';
import { Async } from '../../components/ui/States.jsx';
import { useAsync } from '../../components/ui/hooks.js';
import { useToast } from '../../components/ui/Toast.jsx';
import { useI18n } from '../../context/I18nContext.jsx';
import { isEgPhone } from '../../api/security.js';
import ConfirmForm from '../../components/ui/ConfirmForm.jsx';
import * as api from '../../api/reception.js';

const TIMES = ['09:00', '09:30', '10:00', '11:00', '12:00', '16:00', '17:00'];
const normDigits = (s) => String(s).replace(/[٠-٩]/g, (d) => '٠١٢٣٤٥٦٧٨٩'.indexOf(d));

export default function Appointments() {
  const { t, L, locale, fmtTime } = useI18n();
  const { act } = useToast();

  const pts = useAsync(() => api.getPatients(), []);
  const doctors = useAsync(() => api.getDoctors(), []);

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [err, setErr] = useState({});
  const [patientId, setPatientId] = useState('');
  const [providerId, setProviderId] = useState('');
  // موظف الاستقبال تابع لطبيب واحد: يتحدد تلقائياً
  useEffect(() => { const l = doctors.data; if (Array.isArray(l) && l.length === 1) setProviderId(l[0].id); }, [doctors.data]);
  const [day, setDay] = useState('');
  const [time, setTime] = useState('');
  const [busy, setBusy] = useState(false);
  const [confirming, setConfirming] = useState(false);

  const days = useMemo(() => Array.from({ length: 5 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);

    return {
      id: i === 0 ? 'today' : d.getFullYear() + '-' +
        String(d.getMonth() + 1).padStart(2, '0') + '-' +
        String(d.getDate()).padStart(2, '0'),
      label: i === 0
        ? t('today')
        : i === 1
          ? t('tomorrow')
          : d.toLocaleDateString(locale, { weekday: 'long' }),
    };
  }), [locale, t]);

  const askAdd = (e) => {
    e.preventDefault();

    const er = {};

    if (name.trim().length < 3) er.name = t('err_name');
    if (!isEgPhone(normDigits(phone))) er.phone = t('err_phone');

    setErr(er);

    if (Object.keys(er).length) return;

    setConfirming(true);
  };

  const addPatient = async () => {
    setBusy(true);

    const p = await act(
      () => api.addPatient({ name: name.trim(), phone: normDigits(phone) }),
      'pt_added'
    );

    setBusy(false);
    setConfirming(false);

    if (p) {
      pts.setData((l) => [...l, p]);
      setPatientId(p.id);
      setName('');
      setPhone('');
      setErr({});
    }
  };

  const book = async () => {
    const errors = {};

    if (!patientId) errors.book = t('err_select');
    else if (!providerId) errors.book = t('err_doctor');
    else if (!day || !time) errors.book = t('err_dt');

    if (Object.keys(errors).length) {
      setErr(errors);
      return;
    }

    setErr({});
    setBusy(true);

    const r = await act(
      () => api.bookAppointment({
        patientId,
        providerId,
        date: day,
        time,
      }),
      'booked'
    );

    setBusy(false);

    if (r) {
      setDay('');
      setTime('');
    }
  };

  return (
    <section>
      <h1>{t('ap_title')}</h1>
      <p className="sub">{t('ap_sub')}</p>

      <div className="grid g2">
        <form className="card" onSubmit={askAdd} noValidate>
          <h2>{t('add_pt_title')}</h2>

          <label className="first">{t('name')}</label>
          <input
            value={name}
            maxLength={80}
            onChange={(e) => setName(e.target.value)}
            placeholder={t('name_ph')}
          />
          {err.name && <div className="err">{err.name}</div>}

          <label>{t('phone_label')}</label>
          <input
            dir="ltr"
            inputMode="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="01xxxxxxxxx"
          />
          {err.phone && <div className="err">{err.phone}</div>}

          <div className="btn-row">
            <button
              type="submit"
              className="btn"
              disabled={confirming || busy}
            >
              <Icon name="plusSm" size={16} />
              {t('add_pt')}
            </button>
          </div>

          {confirming && (
            <ConfirmForm
              danger={false}
              message={t('confirm_msg')}
              confirmLabel={t('confirm_yes')}
              cancelLabel={t('confirm_review')}
              busy={busy}
              onConfirm={addPatient}
              onCancel={() => setConfirming(false)}
            />
          )}
        </form>

        <div className="card">
          <h2>{t('book_title')}</h2>

          <label className="first">{t('patient')}</label>
          <Async state={pts}>
            {(list) => (
              <select
                value={patientId}
                onChange={(e) => setPatientId(e.target.value)}
              >
                <option value="">{t('pick_patient')}</option>
                {list.map((p) => (
                  <option key={p.id} value={p.id}>
                    {L(p.name)} — {p.phone}
                  </option>
                ))}
              </select>
            )}
          </Async>

          <label>{t('doctor')}</label>
          <Async state={doctors}>
            {(list) => (
              <select
                value={providerId}
                disabled={list.length === 1}
                onChange={(e) => setProviderId(e.target.value)}
              >
                <option value="">{t('pick_doctor')}</option>
                {list.map((d) => (
                  <option key={d.id} value={d.id}>
                    {L(d.name)}
                    {d.specialty ? ` — ${L(d.specialty)}` : ''}
                  </option>
                ))}
              </select>
            )}
          </Async>

          <label>{t('day')}</label>
          <div className="days">
            {days.map((d) => (
              <button
                type="button"
                key={d.id}
                className={`slot ${day === d.id ? 'on' : ''}`}
                onClick={() => setDay(d.id)}
              >
                {d.label}
              </button>
            ))}
          </div>

          <label>{t('time')}</label>
          <div className="slots">
            {TIMES.map((x) => (
              <button
                type="button"
                key={x}
                className={`slot ${time === x ? 'on' : ''}`}
                onClick={() => setTime(x)}
              >
                {fmtTime(x)}
              </button>
            ))}
          </div>

          {err.book && <div className="err">{err.book}</div>}

          <div className="btn-row">
            <button
              type="button"
              className="btn"
              disabled={busy}
              onClick={book}
            >
              <Icon name="calendarCheck" size={16} />
              {busy ? t('loading') : t('confirm_book')}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
