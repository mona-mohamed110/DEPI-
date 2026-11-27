import { Fragment, useMemo, useState } from 'react';
import Icon from '../../components/Icon.jsx';
import ConfirmForm from '../../components/ui/ConfirmForm.jsx';
import { Async } from '../../components/ui/States.jsx';
import { useAsync } from '../../components/ui/hooks.js';
import { useToast } from '../../components/ui/Toast.jsx';
import { useI18n } from '../../context/I18nContext.jsx';
import * as api from '../../api/reception.js';

export default function Patients() {
  const { t, L, fmtTime, fmtDay } = useI18n();
  const { act } = useToast();
  const state = useAsync(() => api.getRecords(), []);
  const [confirm, setConfirm] = useState(null);
  const [busy, setBusy] = useState(false);
  const [q, setQ] = useState('');
  const [day, setDay] = useState('');
  const filtered = useMemo(() => {
    const k = q.trim().toLowerCase();
    return (state.data || []).filter((p) => (!day || p.date === day) && (!k || [L(p.name), p.phone, L(p.doctor)].some((x) => String(x || '').toLowerCase().includes(k))));
  }, [state.data, q, day, L]);
  const remove = async (id) => {
    setBusy(true);
    const ok = await act(() => api.deleteRecord(id), 'rec_deleted');
    setBusy(false);
    if (ok) { state.setData((l) => l.filter((x) => x.id !== id)); setConfirm(null); }
  };
  return (
    <section>
      <h1>{t('rec_title')}</h1>
      <p className="sub">{t('rec_sub')}</p>
      <div className="card">
        <div className="filters" style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center', marginBottom: 14 }}>
          <div className="search" style={{ flex: '1 1 220px' }}><Icon name="search" size={18} /><input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t('rec_search_ph')} /></div>
          <label style={{ margin: 0 }}>{t('th_date')}</label>
          <input type="date" value={day} onChange={(e) => setDay(e.target.value)} style={{ width: 'auto' }} />
          {(q || day) && <button type="button" className="btn s o" onClick={() => { setQ(''); setDay(''); }}>{t('rec_clear')}</button>}
        </div>
        <Async state={state}>{(all) => { const list = (q || day) ? filtered : all; return list.length === 0 ? <div className="state">{q || day ? t('no_data') : t('rec_empty')}</div> : (
          <div className="scroll"><table>
            <thead><tr><th>{t('th_name')}</th><th>{t('th_phone')}</th><th>{t('th_doctor')}</th><th>{t('th_date')}</th><th>{t('th_time')}</th><th /></tr></thead>
            <tbody>{list.map((p) => (
              <Fragment key={p.id}>
                <tr>
                  <td><b>{L(p.name)}</b></td><td>{p.phone || '—'}</td><td>{L(p.doctor)}</td><td>{p.date ? fmtDay(p.date) : '—'}</td><td>{fmtTime(p.time)}</td>
                  <td><button type="button" className="btn s o dg" onClick={() => setConfirm(p.id)}><Icon name="trash" size={15} />{t('delete')}</button></td>
                </tr>
                {confirm === p.id && <tr><td colSpan={6}><ConfirmForm message={t('rec_del_q', { name: L(p.name) })} busy={busy} onConfirm={() => remove(p.id)} onCancel={() => setConfirm(null)} /></td></tr>}
              </Fragment>
            ))}</tbody>
          </table></div>
        ); }}</Async>
      </div>
    </section>
  );
}
