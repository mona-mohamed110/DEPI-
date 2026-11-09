import { useMemo, useState } from 'react';
import Icon from '../../components/Icon.jsx';
import { Async } from '../../components/ui/States.jsx';
import { useAsync } from '../../components/ui/hooks.js';
import { useToast } from '../../components/ui/Toast.jsx';
import { useI18n } from '../../context/I18nContext.jsx';
import { useReception } from './ReceptionContext.jsx';
import * as api from '../../api/reception.js';

const FILTERS = ['all', 'not-arrived', 'arrived', 'in-exam', 'ended'];
const ACTIONS = [['arrived', 'arrived'], ['in-exam', 'inExam'], ['ended', 'ended']];

export default function Dashboard() {
  const { t, L, num, fmtTime, fmtDay } = useI18n();
  const { act } = useToast();
  const state = useAsync(() => api.getQueue(), []);
  const reqs = useAsync(() => api.getRequests(), []);
  const { refresh } = useReception();
  const [f, setF] = useState('all');
  const [q, setQ] = useState('');

  const change = async (id, status) => {
    const r = await act(() => api.setQueueStatus(id, status));
    if (r) state.setData((l) => l.map((x) => (x.id === r.id ? r : x)));
  };
  // قبول/رفض طلب حجز جاي من مريض (القبول بيضيفه للطابور وعند الدكتور)
  const decide = async (id, ok) => {
    const r = await act(() => (ok ? api.acceptRequest(id) : api.rejectRequest(id)), ok ? 'rq_accepted' : 'rq_rejected');
    if (!r) return;
    reqs.setData((l) => l.filter((x) => x.id !== id));
    refresh();
    if (ok) state.reload();
  };
  const list = useMemo(() => (state.data || []).filter((i) => (f === 'all' || i.status === f) && `${L(i.name)} ${L(i.doctor)}`.toLowerCase().includes(q.trim().toLowerCase())), [state.data, f, q, L]);
  const c = (s) => (state.data || []).filter((i) => i.status === s).length;

  return (
    <section>
      <h1>{t('title')}</h1>
      <p className="sub">{t('subtitle')}</p>
      <Async state={reqs}>{(rq) => rq.length > 0 && (
        <div className="card" style={{ marginBottom: 16 }}>
          <h2>{t('rq_title')} ({num(rq.length)})</h2>
          <p className="sub" style={{ margin: '0 0 8px' }}>{t('rq_sub')}</p>
          {rq.map((x) => (
            <div className="queue-row" key={x.id}>
              <div className="av">{L(x.name).charAt(0)}</div>
              <div className="m"><b>{L(x.name)}</b><small>{t('rq_for')}: {fmtDay(x.date)} · {fmtTime(x.time)}</small></div>
              <div className="act-group">
                <button type="button" className="btn s" onClick={() => decide(x.id, true)}><Icon name="check" size={15} />{t('rq_accept')}</button>
                <button type="button" className="btn s o dg" onClick={() => decide(x.id, false)}><Icon name="x" size={15} />{t('rq_reject')}</button>
              </div>
            </div>
          ))}
        </div>
      )}</Async>
      <Async state={state}>{(all) => (
        <>
          <div className="grid g4">
            {[['total', all.length, 'layers', 'mu'], ['arrived', c('arrived'), 'inbox', 'wn'], ['inExam', c('in-exam'), 'stethoscope', ''], ['ended', c('ended'), 'checkc', 'ok']].map(([k, v, ic, tone]) => (
              <div className="card stat" key={k}><div className={`tile ${tone}`}><Icon name={ic} size={22} /></div><span>{t(k)}</span><b>{num(v)}</b></div>
            ))}
          </div>
          <div className="card" style={{ marginTop: 16 }}>
            <div className="filters"><div className="search"><Icon name="search" size={18} /><input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t('search_ph')} /></div></div>
            <div className="chips" style={{ marginBottom: 10 }}>{FILTERS.map((k) => <button type="button" key={k} className={`chip ${f === k ? 'on' : ''}`} onClick={() => setF(k)}>{k === 'all' ? t('f_all') : t(`st_${k}`)}</button>)}</div>
            {list.length === 0 ? <div className="state">{t('no_data')}</div> : list.map((i) => (
              <div className="queue-row" key={i.id}>
                <div className="av">{L(i.name).charAt(0)}</div>
                <div className="m"><b>{L(i.name)}</b><small>{L(i.doctor)}</small></div>
                <span className="time-tag">{fmtTime(i.time)}</span>
                <span className={`st ${i.status}`}>{t(`st_${i.status}`)}</span>
                <div className="act-group">
                  {ACTIONS.map(([s, k]) => <button type="button" key={s} className={`btn s ${i.status === s ? '' : 'o'}`} onClick={() => change(i.id, s)}>{t(k)}</button>)}
                </div>
              </div>
            ))}
          </div>
        </>
      )}</Async>
    </section>
  );
}
