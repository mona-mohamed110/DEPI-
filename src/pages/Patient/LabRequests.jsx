import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Icon from '../../components/Icon.jsx';
import ConfirmForm from '../../components/ui/ConfirmForm.jsx';
import { Async } from '../../components/ui/States.jsx';
import { useAsync } from '../../components/ui/hooks.js';
import { useToast } from '../../components/ui/Toast.jsx';
import { useI18n } from '../../context/I18nContext.jsx';
import ResultsTabs from './ResultsTabs.jsx';
import { usePatient } from './PatientContext.jsx';
import * as api from '../../api/patient.js';

const ICON = { lab: 'tube', xray: 'scan' };
const BADGE = { awaiting_lab: 'wn', assigned: '', in_progress: '', done: 'ok' };

// التحاليل والأشعة اللي كتبها الدكتور: كارت لكل طلب (عنوانه اسم الدكتور). كل تحليل جواه ممكن يتحجز عند معمل منفصل
// أو الكل في معمل واحد، وفيه "تغيير المعمل" قبل ما المعمل يبدأ. زرار "حجز معمل" بينقل لصفحة الحجز.
export default function LabRequests() {
  const { t, L, fmtDate } = useI18n();
  const nav = useNavigate();
  const { act } = useToast();
  const { refreshLabs, refreshPerms } = usePatient();
  const state = useAsync(() => api.getLabOrders('open'), []);
  const [confirm, setConfirm] = useState(null); // `${orderId}:${itemId}`
  const [busy, setBusy] = useState(false);

  const change = async (o, it) => {
    setBusy(true);
    const r = await act(() => api.unassignLabItem(o.id, it.id), 'lo_changed');
    setBusy(false);
    if (r) { state.setData((l) => l.map((x) => (x.id === r.id ? r : x))); setConfirm(null); refreshLabs(); refreshPerms(); }
  };
  const label = (it) => {
    if (it.status === 'awaiting_lab') return t('lo_item_awaiting');
    if (it.status === 'done') return t('lo_item_done');
    return t(it.status === 'assigned' ? 'lo_item_assigned' : 'lo_item_progress', { lab: L(it.lab) });
  };

  return (
    <section>
      <h1>{t('lo_title')}</h1>
      <p className="sub">{t('lo_sub')}</p>
      <ResultsTabs />
      <Async state={state}>{(list) => (list.length === 0 ? <div className="card state">{t('lo_empty')}</div> : (
        <div className="rx-grid">
          {list.map((o) => {
            const waiting = o.items.some((i) => i.status === 'awaiting_lab');
            return (
              <article className="rx-card" key={o.id}>
                <header className="rx-head">
                  <div className="res-icon"><Icon name="stethoscope" size={22} /></div>
                  <div className="m"><b>{L(o.doctor)}</b><small>{L(o.specialty)} · {t('lo_requested_on')} {fmtDate(o.createdAt)}</small></div>
                </header>
                <p className="rx-dx"><span>{t('lo_tests')}:</span></p>
                <ul className="rx-items lo-tests">
                  {o.items.map((it) => (
                    <li key={it.id} className="rx-item lo-test">
                      <Icon name={ICON[it.kind] || 'file'} size={18} />
                      <div className="lo-info"><b>{it.name}</b><span className={`badge ${BADGE[it.status]}`}>{label(it)}</span></div>
                      {it.status === 'assigned' && <button type="button" className="btn s o" onClick={() => setConfirm(`${o.id}:${it.id}`)}>{t('lo_change_lab')}</button>}
                      {it.status === 'done' && <Link className="btn s o" to="/patient/results">{t('lo_results')}</Link>}
                      {confirm === `${o.id}:${it.id}` && (
                        <ConfirmForm danger={false} message={t('lo_change_q', { name: it.name, lab: L(it.lab) })} confirmLabel={t('lo_change_yes')} busy={busy} onConfirm={() => change(o, it)} onCancel={() => setConfirm(null)} />
                      )}
                    </li>
                  ))}
                </ul>
                {waiting && <button type="button" className="btn" onClick={() => nav('/patient/booking', { state: { labOrder: o } })}><Icon name="flask" size={18} />{t('lo_book')}</button>}
              </article>
            );
          })}
        </div>
      ))}</Async>
    </section>
  );
}
