import { useEffect, useMemo, useState } from 'react';
import Icon from '../../components/Icon.jsx';
import ConfirmForm from '../../components/ui/ConfirmForm.jsx';
import { Async } from '../../components/ui/States.jsx';
import { useAsync } from '../../components/ui/hooks.js';
import { useToast } from '../../components/ui/Toast.jsx';
import { useI18n } from '../../context/I18nContext.jsx';
import DotCalendar, { ymd } from '../../components/ui/DotCalendar.jsx';
import { usePatient } from './PatientContext.jsx';
import * as api from '../../api/patient.js';

const ST = { cancelled: ['dg', 'ap_st_cancelled'], confirmed: ['ok', 'ap_confirmed'], pending: ['wn', 'ap_pending'], rejected: ['dg', 'ap_rejected'], done: ['', 'ap_done'] };
const TABS = ['upcoming', 'all', 'pending', 'confirmed', 'done', 'rejected', 'cancelled'];

export default function Appointments() {
  const { t, L, fmtDay, fmtTime, num, locale } = useI18n();
  const { act, toast } = useToast();
  const { refreshRej } = usePatient();
  const state = useAsync(() => api.getAppointments(), []);
  const list = state.data || [];
  const newRej = list.filter((a) => a.rejectNew).length;
  // بعد عرض الرفض للمريض نعلّمه كمقروء (تبقى علامة "جديد" في هذه الزيارة فقط)
  useEffect(() => {
    if (!newRej) return;
    api.markRejectionsSeen().then(refreshRej).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [newRej]);
  const [edit, setEdit] = useState(null);   // { id, date, time }
  const [cancel, setCancel] = useState(null);
  const [busy, setBusy] = useState(false);
  const todayKey = ymd(new Date());

  // الفلاتر
  const [tab, setTab] = useState('upcoming');
  const [kind, setKind] = useState('all');
  const [q, setQ] = useState('');
  const [day, setDay] = useState('');

  const isUpcoming = (a) => ['pending', 'confirmed'].includes(a.status) && a.date >= todayKey;
  const byTab = (a, k) => (k === 'all' ? true : k === 'upcoming' ? isUpcoming(a) : a.status === k);
  const byKind = (a) => kind === 'all' || a.kind === kind;
  const needle = q.trim().toLowerCase();
  const bySearch = (a) => !needle || `${L(a.doctor)} ${L(a.specialty)} ${a.test || ''}`.toLowerCase().includes(needle);

  // عدد كل تبويب (يراعي نوع الموعد والبحث لكن لا يراعي اليوم)
  const counts = useMemo(() => {
    const c = {};
    TABS.forEach((k) => { c[k] = list.filter((a) => byTab(a, k) && byKind(a) && bySearch(a)).length; });
    return c;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [list, kind, needle]);

  // أيام التقويم: تُظهر نقطة لكل يوم فيه موعد يطابق الفلاتر الحالية (ما عدا اليوم نفسه)
  const dayCounts = useMemo(() => {
    const m = {};
    list.filter((a) => byTab(a, tab) && byKind(a) && bySearch(a)).forEach((a) => { m[a.date] = (m[a.date] || 0) + 1; });
    return m;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [list, tab, kind, needle]);

  const shown = useMemo(() => {
    const r = list.filter((a) => byTab(a, tab) && byKind(a) && bySearch(a) && (!day || a.date === day));
    const dir = tab === 'upcoming' ? 1 : -1;
    return r.sort((x, y) => (`${x.date} ${x.time}` < `${y.date} ${y.time}` ? -dir : dir));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [list, tab, kind, needle, day]);

  const groups = [];
  shown.forEach((a) => {
    const g = groups[groups.length - 1];
    if (g && g.date === a.date) g.items.push(a); else groups.push({ date: a.date, items: [a] });
  });

  const dirty = tab !== 'upcoming' || kind !== 'all' || !!q || !!day;
  const reset = () => { setTab('upcoming'); setKind('all'); setQ(''); setDay(''); };

  const save = async (e) => {
    e.preventDefault();
    if (!edit.date || !edit.time) return;
    setBusy(true);
    const r = await act(() => (edit.request ? api.requestEditAppointment(edit.id, { date: edit.date, time: edit.time }) : api.updateAppointment(edit.id, { date: edit.date, time: edit.time })), edit.request ? undefined : 'saved');
    setBusy(false);
    if (r) { state.setData((l) => l.map((a) => (a.id === r.id ? r : a))); if (edit.request) toast(t('ap_edit_sent')); setEdit(null); }
  };
  const withdraw = async (id) => {
    const r = await act(() => api.withdrawEditRequest(id));
    if (r) state.setData((l) => l.map((a) => (a.id === r.id ? r : a)));
  };
  const doCancel = async (id) => {
    setBusy(true);
    const r = await act(() => api.cancelAppointment(id));
    setBusy(false);
    if (!r) return;
    setCancel(null);
    if (r.row) { state.setData((l) => l.map((a) => (a.id === id ? r.row : a))); toast(t('ap_cancel_sent')); }
    else { state.setData((l) => l.filter((a) => a.id !== id)); toast(t('ap_cancelled')); }
  };

  const dayHead = (k) => {
    const d = new Date(`${k}T00:00:00`);
    const label = d.toLocaleDateString(locale, { weekday: 'long', day: 'numeric', month: 'long' });
    return k === todayKey ? `${t('today')} — ${label}` : label;
  };

  return (
    <section>
      <h1>{t('ap_title')}</h1>
      <p className="sub">{t('ap_sub')}</p>
      {newRej > 0 && <div className="note" role="alert" style={{ marginBottom: 12 }}><Icon name="alert" size={18} /><span>{t('ap_rej_banner', { n: num(newRej) })}</span></div>}

      <Async state={state}>{() => (
        <div className="apx">
          <aside className="apx-side">
            <div className="card">
              <DotCalendar days={dayCounts} value={day} onChange={setDay} />
              {day && (
                <div className="apx-day">
                  <span>{dayHead(day)}</span>
                  <button type="button" className="link-btn" onClick={() => setDay('')}>{t('apf_clear_day')}</button>
                </div>
              )}
            </div>
          </aside>

          <div className="apx-main">
            <div className="card apx-filters">
              <div className="apx-search">
                <Icon name="search" size={17} />
                <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder={t('apf_search')} aria-label={t('apf_search')} />
              </div>
              <div className="apx-tabs" role="tablist">
                {TABS.map((k) => (
                  <button type="button" role="tab" aria-selected={tab === k} key={k} className={tab === k ? 'on' : ''} onClick={() => setTab(k)}>
                    {t(`apf_t_${k}`)}<em>{num(counts[k])}</em>
                  </button>
                ))}
              </div>
              <div className="apx-kinds">
                {['all', 'doctor', 'lab'].map((k) => (
                  <button type="button" key={k} className={kind === k ? 'on' : ''} onClick={() => setKind(k)}>
                    {k !== 'all' && <Icon name={k === 'lab' ? 'flask' : 'stethoscope'} size={14} />}{t(`apf_k_${k}`)}
                  </button>
                ))}
                {dirty && <button type="button" className="apx-reset" onClick={reset}><Icon name="x" size={14} />{t('apf_reset')}</button>}
              </div>
            </div>

            {shown.length === 0 ? (
              <div className="card"><div className="state">{list.length === 0 ? t('ap_empty') : t('apf_none')}</div></div>
            ) : (
              <>
                <p className="apx-count">{t('apf_count', { n: num(shown.length) })}</p>
                {groups.map((g) => (
                  <div className="apx-group" key={g.date}>
                    <h3 className={g.date === todayKey ? 'today' : ''}>{dayHead(g.date)}</h3>
                    <div className="card">
                      {g.items.map((a) => (
                        <div className="row apx-item" key={a.id}>
                          <div className="apx-time">{fmtTime(a.time)}</div>
                          <div className="av" style={{ flex: '0 0 auto' }}><Icon name={a.kind === 'lab' ? 'flask' : 'stethoscope'} size={18} /></div>
                          <div className="m"><b>{L(a.doctor)}</b><small>{L(a.specialty)}{a.test ? ` · ${t('ap_test')}: ${a.test}` : ''}</small></div>
                          <span className={`badge ${ST[a.status]?.[0] || ''}`}>{t(ST[a.status]?.[1] || 'ap_pending')}</span>
                          {a.rejectNew && <span className="badge dg">{t('ap_new')}</span>}
                          {a.status === 'rejected' && a.rejectReason && <div style={{ flexBasis: '100%', color: 'var(--mu)', fontSize: 13 }}>{t('ap_rej_reason')}: {a.rejectReason}</div>}
                          {a.editable && !a.cancelRequested && <button type="button" className="btn s o" onClick={() => { setCancel(null); setEdit({ id: a.id, date: a.date, time: a.time }); }}><Icon name="edit" size={15} />{t('ap_edit')}</button>}
                          {a.editRequest && !a.cancelRequested && <span className="badge wn">{t('ap_edit_wait', { when: `${fmtDay(a.editRequest.date)} · ${fmtTime(a.editRequest.time)}` })}</span>}
                          {a.editRequest && !a.cancelRequested && <button type="button" className="btn s o" onClick={() => withdraw(a.id)}>{t('ap_edit_withdraw')}</button>}
                          {a.editDeclined && !a.editRequest && <span className="badge dg">{t('ap_edit_declined')}</span>}
                          {a.canRequestEdit && <button type="button" className="btn s o" onClick={() => { setCancel(null); setEdit({ id: a.id, date: a.date, time: a.time, request: true }); }}><Icon name="edit" size={15} />{t('ap_edit_req')}</button>}
                          {a.cancelRequested && <span className="badge wn">{t('ap_cancel_wait')}</span>}
                          {a.cancelDeclined && !a.cancelRequested && <span className="badge dg">{t('ap_cancel_declined')}</span>}
                          {a.status === 'confirmed' && a.kind === 'doctor' && !a.cancelRequested && !a.canRequestEdit && !a.editRequest && <span className="apx-lock"><Icon name="lock" size={13} />{t('ap_locked')}</span>}
                          {['pending', 'confirmed'].includes(a.status) && !a.cancelRequested && <button type="button" className="btn s o dg" onClick={() => { setEdit(null); setCancel(a.id); }}><Icon name="x" size={15} />{t(a.kind === 'doctor' ? 'ap_cancel_req' : 'ap_cancel')}</button>}

                          {edit?.id === a.id && (
                            <form className="confirm-form" style={{ background: 'var(--pr2)', borderColor: 'var(--bd)' }} onSubmit={save}>
                              {edit.request && <span className="confirm-msg">{t('ap_edit_req_hint')}</span>}
                              <div className="inline" style={{ flex: 1 }}>
                                <input type="date" min={todayKey} value={edit.date} onChange={(e) => setEdit({ ...edit, date: e.target.value })} aria-label={t('ap_date')} />
                                <input type="time" value={edit.time} onChange={(e) => setEdit({ ...edit, time: e.target.value })} aria-label={t('ap_time')} />
                              </div>
                              <div className="confirm-actions">
                                <button type="submit" className="btn s" disabled={busy}>{busy ? t('ap_saving') : t(edit.request ? 'ap_edit_send' : 'ap_save')}</button>
                                <button type="button" className="btn s o" onClick={() => setEdit(null)}>{t('ap_close')}</button>
                              </div>
                            </form>
                          )}
                          {cancel === a.id && <ConfirmForm message={t(a.kind === 'doctor' ? 'ap_cancel_req_q' : 'ap_cancel_q')} confirmLabel={t(a.kind === 'doctor' ? 'ap_cancel_req_yes' : 'ap_cancel_yes')} busy={busy} onConfirm={() => doCancel(a.id)} onCancel={() => setCancel(null)} />}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </>
            )}
          </div>
        </div>
      )}</Async>
    </section>
  );
}
