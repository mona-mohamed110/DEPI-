// صفحة "تواصل مع الإدارة" لكل الأدوار غير الأدمن: إرسال رسالة/شكوى/اقتراح + متابعة ردود الإدارة
import { useState } from 'react';
import Icon from '../Icon.jsx';
import { Async } from '../ui/States.jsx';
import { useAsync } from '../ui/hooks.js';
import { useToast } from '../ui/Toast.jsx';
import { useI18n } from '../../context/I18nContext.jsx';
import * as api from '../../api/support.js';

const KINDS = ['message', 'complaint', 'suggestion'];
const TONE = { new: 'wn', replied: 'ok', closed: 'mu' };

function Thread({ m, onChange }) {
  const { t, fmtDateTime } = useI18n();
  const { act } = useToast();
  const [open, setOpen] = useState(false);
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);

  const toggle = async () => {
    const next = !open;
    setOpen(next);
    if (next && m.unread) {
      try { onChange(await api.markSeen(m.id)); } catch { /* ignore */ }
    }
  };
  const send = async (e) => {
    e.preventDefault();
    if (text.trim().length < 2) return;
    setBusy(true);
    const r = await act(() => api.reply(m.id, text.trim()), 'ct_reply_sent');
    setBusy(false);
    if (r) { onChange(r); setText(''); }
  };

  return (
    <div className={`ct-item ${m.unread ? 'unread' : ''}`}>
      <button type="button" className="ct-head" onClick={toggle} aria-expanded={open}>
        <div className="m">
          <b>{m.subject || m.message.slice(0, 60)}</b>
          <small>{t(`ct_k_${m.kind}`)} · {fmtDateTime(m.createdAt)}</small>
        </div>
        {m.unread && <span className="badge dg">{t('ct_new_reply')}</span>}
        <span className={`badge ${TONE[m.status]}`}>{t(`ct_s_${m.status}`)}</span>
      </button>
      {open && (
        <div className="ct-body">
          <div className="ct-msg me"><p>{m.message}</p><small>{t('ct_you')} · {fmtDateTime(m.createdAt)}</small></div>
          {m.replies.map((r) => (
            <div key={r.id} className={`ct-msg ${r.from === 'admin' ? 'admin' : 'me'}`}>
              <p>{r.text}</p>
              <small>{r.from === 'admin' ? t('ct_admin') : t('ct_you')} · {fmtDateTime(r.at)}</small>
            </div>
          ))}
          {m.status === 'closed' ? <div className="sub">{t('ct_closed_note')}</div> : (
            <form onSubmit={send} noValidate>
              <textarea rows={3} maxLength={2000} value={text} onChange={(e) => setText(e.target.value)} placeholder={t('ct_reply_ph')} />
              <div className="btn-row"><button type="submit" className="btn s" disabled={busy || text.trim().length < 2}>{t('ct_reply')}</button></div>
            </form>
          )}
        </div>
      )}
    </div>
  );
}

export default function SupportPage() {
  const { t } = useI18n();
  const { act, toast } = useToast();
  const state = useAsync(() => api.getMine(), []);
  const [f, setF] = useState({ kind: 'message', subject: '', message: '' });
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setF((x) => ({ ...x, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    if (f.message.trim().length < 5) return toast(t('ct_short'));
    setBusy(true);
    const r = await act(() => api.send({ ...f, message: f.message.trim() }), 'ct_sent');
    setBusy(false);
    if (r) {
      state.setData((l) => [r, ...(l || [])]);
      setF({ kind: 'message', subject: '', message: '' });
    }
  };
  const update = (m) => state.setData((l) => l.map((x) => (x.id === m.id ? m : x)));

  return (
    <section>
      <h1>{t('ct_title')}</h1>
      <p className="sub">{t('ct_sub')}</p>
      <div className="grid g2">
        <form className="card" onSubmit={submit} noValidate>
          <h2><Icon name="mail" size={18} /> {t('ct_new')}</h2>
          <label className="first" htmlFor="ct-kind">{t('ct_kind')}</label>
          <select id="ct-kind" value={f.kind} onChange={set('kind')}>
            {KINDS.map((k) => <option key={k} value={k}>{t(`ct_k_${k}`)}</option>)}
          </select>
          <label htmlFor="ct-subject">{t('ct_subject')}</label>
          <input id="ct-subject" maxLength={120} value={f.subject} onChange={set('subject')} />
          <label htmlFor="ct-message">{t('ct_message')}</label>
          <textarea id="ct-message" rows={5} maxLength={2000} placeholder={t('ct_ph')} value={f.message} onChange={set('message')} />
          <div className="btn-row"><button type="submit" className="btn" disabled={busy}>{busy ? t('loading') : t('ct_send')}</button></div>
        </form>

        <div className="card">
          <h2><Icon name="inbox" size={18} /> {t('ct_mine')}</h2>
          <Async state={state}>{(list) => (list.length === 0
            ? <div className="state">{t('ct_none')}</div>
            : list.map((m) => <Thread key={m.id} m={m} onChange={update} />))}
          </Async>
        </div>
      </div>
    </section>
  );
}
