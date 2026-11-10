import { useMemo, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import Icon from '../../components/Icon.jsx';
import PlaceSearch from '../../components/home/PlaceSearch.jsx';
import { useToast } from '../../components/ui/Toast.jsx';
import { useI18n } from '../../context/I18nContext.jsx';
import { TEST_CATALOG } from '../../config/catalog.js';
import { usePatient } from './PatientContext.jsx';
import * as api from '../../api/patient.js';

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
  const { t, L, lang, num, locale } = useI18n();
  const { act, toast } = useToast();
  const { refreshLabs, refreshPerms } = usePatient();
  const loc = useLocation();
  // وضع "حجز التحاليل المطلوبة": جاي من صفحة التحاليل المطلوبة، والمريض يختار المعمل ويحجز
  const [order, setOrder] = useState(() => loc.state?.labOrder || null);
  const awaiting = (o) => (o ? o.items.filter((i) => i.status === 'awaiting_lab') : []);
  const [picked, setPicked] = useState(() => awaiting(loc.state?.labOrder).map((i) => i.id));   // التحاليل اللي هتتحجز عند المعمل ده
  const [doctor, setDoctor] = useState(() => (loc.state?.labOrder ? null : pickDoctor(loc.state)));
  const [searching, setSearching] = useState(!!loc.state?.labOrder);
  const [day, setDay] = useState('');
  const [time, setTime] = useState('');
  const [test, setTest] = useState('');
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);
  const isLab = doctor?.type === 'lab';

  const days = useMemo(() => {
    if (!doctor) return [];
    const avail = doctor.availableDays?.length ? doctor.availableDays : FALLBACK_DAYS;
    const base = new Date(); base.setHours(0, 0, 0, 0);
    const out = [];
    for (let i = 0; i < 14 && out.length < 7; i += 1) {
      const d = new Date(base); d.setDate(base.getDate() + i);
      if (avail.includes(d.getDay())) out.push({ k: key(d), label: i === 0 ? t('today') : i === 1 ? t('tomorrow') : d.toLocaleDateString(locale, { weekday: 'short' }), n: d.getDate(), m: d.toLocaleDateString(locale, { month: 'short' }), full: d.toLocaleDateString(locale, { weekday: 'long', day: 'numeric', month: 'long' }) });
    }
    return out;
  }, [doctor, locale, t]);

  const slots = (doctor?.timeSlots?.length ? doctor.timeSlots : FALLBACK_SLOTS).filter((s) => !day || new Date(`${day}T${s}:00`) > new Date());
  const fmt = (s) => { const [h, m] = s.split(':').map(Number); return new Date(2000, 0, 1, h, m).toLocaleTimeString(locale, { hour: 'numeric', minute: '2-digit' }); };

  // اختيار طبيب/معمل من البحث الداخلي (من غير الخروج من الصفحة)
  const choose = (p) => { setDoctor(p); setSearching(false); setDay(''); setTime(''); setTest(''); setDone(false); };

  const confirm = async () => {
    if (!doctor || !day || !time) return;
    if (isLab && !order && !test) return toast(t('bk_need_test'));
    if (order && !picked.length) return toast(t('bk_order_none'));
    setBusy(true);
    const r = await act(() => (order
      ? api.assignLabOrder(order.id, { labId: doctor.id, date: day, time, itemIds: picked })
      : api.bookAppointment({ doctorId: doctor.id, date: day, time, test: isLab ? test : undefined })));
    setBusy(false);
    if (r) {
      try { sessionStorage.removeItem(PENDING_KEY); } catch { /* ignore */ }
      if (order && r.order) setOrder(r.order);
      setDone(true); refreshLabs(); refreshPerms();
    }
  };

  return (
    <section>
      <div className="hello"><h1>{t(order ? 'bk_order_title' : 'title')}</h1>
        <button type="button" className={`btn ${searching ? 'o' : ''}`} onClick={() => setSearching((s) => !s)}><Icon name={searching ? 'x' : 'search'} size={18} />{searching ? t('bk_close_search') : t('searchButton')}</button>
      </div>
      <p className="hello-sub">{t(order ? 'bk_order_pick' : 'searchHint')}</p>

      {order && (
        <div className="card" style={{ marginBottom: 16 }}>
          <div className="row" style={{ border: 0, padding: 0 }}>
            <div className="res-icon"><Icon name="stethoscope" size={22} /></div>
            <div className="m"><small>{t('bk_order_from')}</small><b>{L(order.doctor)}</b><small>{L(order.specialty)}</small></div>
          </div>
          <h3 style={{ margin: '14px 0 6px' }}>{t('bk_order_items')}</h3>
          <div className="chips">
            {order.items.map((it) => (it.status === 'awaiting_lab' ? (
              <button type="button" key={it.id} className={`chip ${picked.includes(it.id) ? 'on' : ''}`} aria-pressed={picked.includes(it.id)} disabled={done}
                onClick={() => setPicked((x) => (x.includes(it.id) ? x.filter((i) => i !== it.id) : [...x, it.id]))}>
                <Icon name={it.kind === 'xray' ? 'scan' : 'tube'} size={15} />{it.name}
              </button>
            ) : (
              <span key={it.id} className="chip" style={{ opacity: 0.6 }}><Icon name="check" size={14} />{it.name} · {L(it.lab) || t('lo_item_done')}</span>
            )))}
          </div>
          <p className="sub" style={{ margin: '8px 0 0', fontSize: 13 }}>{t('bk_order_split')}</p>
          <div className="note" style={{ marginTop: 12 }}><Icon name="info" size={18} /><span>{t('bk_order_note')}</span></div>
        </div>
      )}

      {searching && <div className="search-wrap"><PlaceSearch title={false} onPick={choose} onlyType={order ? 'lab' : ''} /></div>}

      {!searching && !doctor && (
        <div className="card state">
          <Icon name="calendarPlus" size={40} />
          <h2 style={{ marginTop: 10 }}>{t('noDoctor')}</h2>
          <button type="button" className="btn" onClick={() => setSearching(true)}>{t('searchButton')}</button>
        </div>
      )}

      {!searching && doctor && (
        <>
          <div className="card">
            <div className="row" style={{ border: 0 }}>
              <div className="av"><Icon name={isLab ? 'flask' : 'stethoscope'} size={20} /></div>
              <div className="m"><small>{t('selectedDoctor')}</small><b>{L(doctor.name)}</b><small>{L(doctor.specialty)}</small></div>
              {doctor.rating != null && <span className="badge"><Icon name="star" size={13} />{num(doctor.rating)}</span>}
              <button type="button" className="btn s o" onClick={() => setSearching(true)}>{t('changeDoctor')}</button>
            </div>
            {!order && <div className="note" style={{ marginTop: 12 }}><Icon name="info" size={18} /><span>{t(isLab ? 'bk_note_lab' : 'bk_note_doctor')}</span></div>}
          </div>

          <div className="card" style={{ marginTop: 16 }}>
            {isLab && !order && (
              <>
                <h2>{t('bk_lab_test')}</h2>
                <select value={test} onChange={(e) => { setTest(e.target.value); setDone(false); }}>
                  <option value="">—</option>
                  {TEST_CATALOG.map((c) => <option key={c.ar} value={c.ar}>{lang === 'ar' ? c.ar : c.en}</option>)}
                </select>
              </>
            )}
            <h2 style={isLab && !order ? { marginTop: 20 } : undefined}>{t('stepDay')}</h2>
            {days.length === 0 ? <div className="state">{t('noDays')}</div> : (
              <div className="days">{days.map((d) => (
                <button type="button" key={d.k} className={`day ${day === d.k ? 'on' : ''}`} aria-pressed={day === d.k} onClick={() => { setDay(d.k); setTime(''); setDone(false); }}>
                  <small>{d.label}</small><b>{num(d.n)}</b><small>{d.m}</small>
                </button>
              ))}</div>
            )}
            {day && (
              <>
                <h2 style={{ marginTop: 20 }}>{t('stepTime')}</h2>
                {slots.length === 0 ? <div className="state">{t('noSlots')}</div> : (
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
                <span>{t(order ? 'bk_order_sent' : 'bk_sent')} — <b>{L(doctor.name)}</b> · {days.find((x) => x.k === day)?.full} · {fmt(time)} · <Link className="link-btn" to="/patient/appointments">{t('nav_appts')}</Link>{order && <> · <Link className="link-btn" to="/patient/results">{t('bk_order_results')}</Link></>}</span>
                {order && awaiting(order).length > 0 && (
                  <button type="button" className="btn s" style={{ marginInlineStart: 12 }} onClick={() => { setPicked(awaiting(order).map((i) => i.id)); setDoctor(null); setDay(''); setTime(''); setDone(false); setSearching(true); }}>
                    {t('bk_order_remaining')} ({t('bk_order_left', { n: num(awaiting(order).length) })})
                  </button>
                )}
              </div>
            )}
          </div>
        </>
      )}
    </section>
  );
}
