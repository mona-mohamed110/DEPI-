import { Fragment, useState } from 'react';
import Icon from '../../components/Icon.jsx';
import ConfirmForm from '../../components/ui/ConfirmForm.jsx';
import { Async } from '../../components/ui/States.jsx';
import { useAsync } from '../../components/ui/hooks.js';
import { useToast } from '../../components/ui/Toast.jsx';
import { useI18n } from '../../context/I18nContext.jsx';
import * as api from '../../api/reception.js';

export default function Patients() {
  const { t, L, fmtTime } = useI18n();
  const { act } = useToast();
  const state = useAsync(() => api.getRecords(), []);
  const [confirm, setConfirm] = useState(null);
  const [busy, setBusy] = useState(false);
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
        <Async state={state}>{(list) => list.length === 0 ? <div className="state">{t('rec_empty')}</div> : (
          <div className="scroll"><table>
            <thead><tr><th>{t('th_name')}</th><th>{t('th_phone')}</th><th>{t('th_doctor')}</th><th>{t('th_time')}</th><th /></tr></thead>
            <tbody>{list.map((p) => (
              <Fragment key={p.id}>
                <tr>
                  <td><b>{L(p.name)}</b></td><td>{p.phone || '—'}</td><td>{L(p.doctor)}</td><td>{fmtTime(p.time)}</td>
                  <td><button type="button" className="btn s o dg" onClick={() => setConfirm(p.id)}><Icon name="trash" size={15} />{t('delete')}</button></td>
                </tr>
                {confirm === p.id && <tr><td colSpan={5}><ConfirmForm message={t('rec_del_q', { name: L(p.name) })} busy={busy} onConfirm={() => remove(p.id)} onCancel={() => setConfirm(null)} /></td></tr>}
              </Fragment>
            ))}</tbody>
          </table></div>
        )}</Async>
      </div>
    </section>
  );
}
