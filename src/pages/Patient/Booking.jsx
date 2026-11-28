import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import Icon from '../../components/Icon.jsx';
import PlaceSearch from '../../components/home/PlaceSearch.jsx';
import { useToast } from '../../components/ui/Toast.jsx';
import { useI18n } from '../../context/I18nContext.jsx';
import { TEST_CATALOG } from '../../config/catalog.js';
import * as api from '../../api/patient.js';
import { dayOn, slotsForDate } from '../../utils/schedule.js';
import { API_URL } from '../../config/env.js';
import WorkCalendar from '../../components/ui/WorkCalendar.jsx';

const PENDING_KEY = 'shefaa_pending_booking';
const FALLBACK_DAYS = [0, 1, 2, 3, 4, 6];
const FALLBACK_SLOTS = ['10:00', '10:30', '11:00', '16:00', '16:30', '17:00'];
const key = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

// الدكتور بييجي من البحث الداخلي، أو من الصفحة العامة (state)، أو اختيار محفوظ قبل تسجيل الدخول
function pickDoctor(state) {
  if (state?.selectedDoctor) return state.selectedDoctor;
  try { return JSON.parse(sessionStorage.getItem(PENDING_KEY)); } catch { return null; }
}

export default function Booking() {
  const { t, L, lang, num, locale, fmtDay } = useI18n();
  const { act, toast } = useToast();
  const loc = useLocation();
  const [doctor, setDoctor] = useState(() => pickDoctor(loc.state));
  const [searching, setSearching] = useState(false);
  const [day, setDay] = useState('');
  const [time, setTime] = useState('');
  const [test, setTest] = useState(() => loc.state?.test || '');
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);
  const [mine, setMine] = useState(null);
  const [active, setActive] = useState(null); // حجز مفتوح عند الطبيب المختار
  useEffect(() => { api.getMyProviders().then((r) => setMine(Array.isArray(r) ? r : [])).catch(() => setMine([])); }, []);
  const isLab = doctor?.type === 'lab';
  useEffect(() => {
    setActive(null);
    if (!doctor?.id || doctor.type === 'lab') return;
    let off = false;
    api.getActiveBooking(doctor.id).then((r) => { if (!off) setActive(r?.booking || null); }).catch(() => {});
    return () => { off = true; };
  }, [doctor?.id, doctor?.type]);
  // الفحوصات التي يوفرها هذا المعمل (إن لم يرسلها الخادم نعرض الكتالوج كله)
  const labTests = isLab && Array.isArray(doctor?.tests) ? TEST_CATALOG.filter((c) => doctor.tests.includes(c.ar)) : TEST_CATALOG;
  const customTests = isLab && Array.isArray(doctor?.tests) ? doctor.tests.filter((n) => !TEST_CATALOG.some((x) => x.ar === n)) : [];
  // الفحص المختار يُعتمد فقط إذا كان المعمل يوفره (مثلاً قادمًا من صفحة فرز الأعراض)
  const testValue = [...labTests.map((c) => c.ar), ...customTests].includes(test) ? test : '';

  // ساعات العمل: من جدول الطبيب/المعمل الفعلي، أو من الأيام القديمة لو الجدول مش موجود
  const schedule = useMemo(() => {
    if (!doctor) return null;
    if (doctor.schedule) return doctor.schedule;
    const avail = doctor.availableDays?.length ? doctor.availableDays : FALLBACK_DAYS;
    return Array.from({ length: 7 }, (_, i) => ({ on: avail.includes(i), from: '10:00', to: '17:00' }));
  }, [doctor]);
  const anyDay = !!schedule && schedule.some((_, i) => dayOn(schedule, i));
  const dayFull = day ? new Date(`${day}T00:00:00`).toLocaleDateString(locale, { weekday: 'long', day: 'numeric', month: 'long' }) : '';

  const baseSlots = doctor?.schedule ? slotsForDate(doctor.schedule, day) : (doctor?.timeSlots?.length ? doctor.timeSlots : FALLBACK_SLOTS);
  // الأوقات المحجوزة فعلاً عند هذا الطبيب/المعمل في اليوم المختار
  const [booked, setBooked] = useState([]);
  const loadBooked = useCallback(() => {
    if (!doctor?.id || !day) { setBooked([]); return Promise.resolve(); }
    return api.getBookedSlots(doctor.id, day).then((r) => setBooked((r && r.times) || [])).catch(() => setBooked([]));
  }, [doctor?.id, day]);
  useEffect(() => { loadBooked(); }, [loadBooked]);
  const slots = baseSlots.filter((s) => (!day || new Date(`${day}T${s}:00`) > new Date()) && !booked.includes(s));
  const fmt = (s) => { const [h, m] = s.split(':').map(Number); return new Date(2000, 0, 1, h, m).toLocaleTimeString(locale, { hour: 'numeric', minute: '2-digit' }); };

  // اختيار طبيب/معمل من البحث الداخلي (من غير الخروج من الصفحة)
  const choose = (p) => { setDoctor(p); setSearching(false); setDay(''); setTime(''); setTest(''); setDone(false); };

  const confirm = async () => {
    if (!doctor || !day || !time) return;
    if (isLab && !testValue) return toast(t('bk_need_test'));
    setBusy(true);
    const r = await act(() => api.bookAppointment({ doctorId: doctor.id, date: day, time, test: isLab ? testValue : undefined }));
    setBusy(false);
    if (!r) { setTime(''); loadBooked(); }
    if (r) { try { sessionStorage.removeItem(PENDING_KEY); } catch { /* ignore */ } setDone(true); }
  };

  return (
    <section>
      <div className="hello"><h1>{t('title')}</h1>
        <button type="button" className={`btn ${searching ? 'o' : ''}`} onClick={() => setSearching((s) => !s)}><Icon name={searching ? 'x' : 'search'} size={18} />{searching ? t('bk_close_search') : t('searchButton')}</button>
      </div>
      <p className="hello-sub">{t('searchHint')}</p>

      {searching && <div className="search-wrap"><PlaceSearch title={false} onPick={choose} /></div>}

      {!searching && !doctor && mine && mine.length === 0 && (
        <div className="card state">
          <Icon name="calendarPlus" size={40} />
          <h2 style={{ marginTop: 10 }}>{t('noDoctor')}</h2>
          <button type="button" className="btn" onClick={() => setSearching(true)}>{t('searchButton')}</button>
        </div>
      )}

      {!searching && mine && mine.length > 0 && (
        <div className="card" style={{ marginTop: 16 }}>
          <h2>{t('bk_my_providers')}</h2>
          <p className="hello-sub" style={{ marginTop: 4 }}>{t('bk_my_providers_hint')}</p>
          {mine.map((p) => (
            <div className="row" key={p.id}>
              <div className="av" style={p.avatarV ? { padding: 0, overflow: 'hidden' } : undefined}>{p.avatarV ? <img src={`${API_URL}/public/avatar/${p.id}?v=${p.avatarV}`} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <Icon name={p.type === 'lab' ? 'flask' : 'stethoscope'} size={20} />}</div>
              <div className="m"><b>{L(p.name)}</b><small>{L(p.specialty)}</small></div>
              {p.rating > 0 && <span className="badge"><Icon name="star" size={13} />{num(p.rating)}</span>}
              <button type="button" className={`btn s ${doctor?.id === p.id ? 'o' : ''}`} onClick={() => choose(p)}>{t('bk_book_again')}</button>
            </div>
          ))}
        </div>
      )}

      {!searching && doctor && (
        <>
          <div className="card">
            <div className="row" style={{ border: 0 }}>
              <div className="av" style={doctor.avatarV ? { padding: 0, overflow: 'hidden' } : undefined}>{doctor.avatarV ? <img src={`${API_URL}/public/avatar/${doctor.id}?v=${doctor.avatarV}`} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <Icon name={isLab ? 'flask' : 'stethoscope'} size={20} />}</div>
              <div className="m"><small>{t('selectedDoctor')}</small><b>{L(doctor.name)}</b><small>{L(doctor.specialty)}</small></div>
              {doctor.rating > 0 && <span className="badge"><Icon name="star" size={13} />{num(doctor.rating)}{doctor.ratingCount ? ` (${num(doctor.ratingCount)})` : ''}</span>}
              <button type="button" className="btn s o" onClick={() => setSearching(true)}>{t('changeDoctor')}</button>
            </div>
            <div className="note" style={{ marginTop: 12 }}><Icon name="info" size={18} /><span>{t(isLab ? 'bk_note_lab' : 'bk_note_doctor')}</span></div>
          </div>

          {active ? (
            <div className="card" style={{ marginTop: 16 }}>
              <div className="note"><Icon name="alert" size={18} /><span>{t('bk_has_active', { date: fmtDay(active.date), time: fmt(active.time) })}</span></div>
              <div className="btn-row"><Link className="btn" to="/patient/appointments">{t('nav_appts')}</Link></div>
            </div>
          ) : (
          <div className="card" style={{ marginTop: 16 }}>
            {isLab && (
              <>
                <h2>{t('bk_lab_test')}</h2>
                <select value={testValue} onChange={(e) => { setTest(e.target.value); setDone(false); }}>
                  <option value="">—</option>
                  {labTests.map((c) => <option key={c.ar} value={c.ar}>{lang === 'ar' ? c.ar : c.en}</option>)}
                  {customTests.map((n) => <option key={n} value={n}>{n}</option>)}
                </select>
              </>
            )}
            <h2 style={isLab ? { marginTop: 20 } : undefined}>{t('stepDay')}</h2>
            {!anyDay ? <div className="state">{t('noDays')}</div> : (
              <WorkCalendar value={day} schedule={schedule} onChange={(d) => { setDay(d); setTime(''); setDone(false); }} />
            )}
            {day && (
              <>
                <h2 style={{ marginTop: 20 }}>{t('stepTime')}</h2>
                {slots.length === 0 ? <div className="state">{t(booked.length ? 'bk_all_booked' : 'noSlots')}</div> : (
                  <div className="slots">{slots.map((s) => <button type="button" key={s} className={`slot ${time === s ? 'on' : ''}`} onClick={() => { setTime(s); setDone(false); }}>{fmt(s)}</button>)}</div>
                )}
              </>
            )}
            <div className="btn-row">
              <button type="button" className="btn" disabled={!day || !time || busy || done} onClick={confirm}><Icon name="check" size={18} />{busy ? t('loading') : t('confirm')}</button>
            </div>
            {done && (
              <div className="note" style={{ marginTop: 14 }}>
                <Icon name="checkc" size={18} />
                <span>{t('bk_sent')} — <b>{L(doctor.name)}</b> · {dayFull} · {fmt(time)} · <Link className="link-btn" to="/patient/appointments">{t('nav_appts')}</Link></span>
              </div>
            )}
          </div>
          )}
        </>
      )}
    </section>
  );
}
