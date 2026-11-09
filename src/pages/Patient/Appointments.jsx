import { useState } from 'react';
import Icon from '../../components/Icon.jsx';
import ConfirmForm from '../../components/ui/ConfirmForm.jsx';
import { Async } from '../../components/ui/States.jsx';
import { useAsync } from '../../components/ui/hooks.js';
import { useToast } from '../../components/ui/Toast.jsx';
import { useI18n } from '../../context/I18nContext.jsx';
import * as api from '../../api/patient.js';

const ST = { confirmed: ['ok', 'ap_confirmed'], pending: ['wn', 'ap_pending'], rejected: ['dg', 'ap_rejected'], done: ['', 'ap_done'] };

export default function Appointments() {
  const { t, L, fmtDay, fmtTime } = useI18n();
  const { act } = useToast();
  const state = useAsync(() => api.getAppointments(), []);
  const [edit, setEdit] = useState(null);   // { id, date, time }
  const [cancel, setCancel] = useState(null);
  const [busy, setBusy] = useState(false);
  const today = new Date().toISOString().slice(0, 10);

  const save = async (e) => {
    e.preventDefault();
    if (!edit.date || !edit.time) return;
    setBusy(true);
    const r = await act(() => api.updateAppointment(edit.id, { date: edit.date, time: edit.time }), 'saved');
    setBusy(false);
    if (r) { state.setData((l) => l.map((a) => (a.id === r.id ? r : a))); setEdit(null); }
  };
  const doCancel = async (id) => {
    setBusy(true);
    const ok = await act(() => api.cancelAppointment(id), 'ap_cancelled');
    setBusy(false);
    if (ok) { state.setData((l) => l.filter((a) => a.id !== id)); setCancel(null); }
  };

  return (
    <section>
      <h1>{t('ap_title')}</h1>
      <p className="sub">{t('ap_sub')}</p>
      <div className="card">
        <Async state={state}>{(list) => list.length === 0 ? <div className="state">{t('ap_empty')}</div> : list.map((a) => (
          <div className="row" key={a.id}>
            <div className="av">{L(a.doctor).replace(/^(د\.|Dr\.)\s*/, '').charAt(0)}</div>
            <div className="m"><b>{L(a.doctor)}</b><small>{L(a.specialty)} · {fmtDay(a.date)} · {fmtTime(a.time)}{a.test ? ` · ${t('ap_test')}: ${a.test}` : ''}</small></div>
            <span className={`badge ${ST[a.status]?.[0] || ''}`}>{t(ST[a.status]?.[1] || 'ap_pending')}</span>
            {['pending', 'confirmed'].includes(a.status) && a.kind === 'doctor' && <button type="button" className="btn s o" onClick={() => { setCancel(null); setEdit({ id: a.id, date: a.date, time: a.time }); }}><Icon name="edit" size={15} />{t('ap_edit')}</button>}
            <button type="button" className="btn s o dg" onClick={() => { setEdit(null); setCancel(a.id); }}><Icon name="x" size={15} />{t('ap_cancel')}</button>

            {edit?.id === a.id && (
              <form className="confirm-form" style={{ background: 'var(--pr2)', borderColor: 'var(--bd)' }} onSubmit={save}>
                <div className="inline" style={{ flex: 1 }}>
                  <input type="date" min={today} value={edit.date} onChange={(e) => setEdit({ ...edit, date: e.target.value })} aria-label={t('ap_date')} />
                  <input type="time" value={edit.time} onChange={(e) => setEdit({ ...edit, time: e.target.value })} aria-label={t('ap_time')} />
                </div>
                <div className="confirm-actions">
                  <button type="submit" className="btn s" disabled={busy}>{busy ? t('ap_saving') : t('ap_save')}</button>
                  <button type="button" className="btn s o" onClick={() => setEdit(null)}>{t('ap_close')}</button>
                </div>
              </form>
            )}
            {cancel === a.id && <ConfirmForm message={t('ap_cancel_q')} confirmLabel={t('ap_cancel_yes')} busy={busy} onConfirm={() => doCancel(a.id)} onCancel={() => setCancel(null)} />}
          </div>
        ))}</Async>
      </div>
    </section>
  );
}
