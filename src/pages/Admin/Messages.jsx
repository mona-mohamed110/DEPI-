import { useCallback, useEffect, useState } from 'react';
import Icon from '../../components/Icon.jsx';
import { Async } from '../../components/ui/States.jsx';
import { useAsync } from '../../components/ui/hooks.js';
import { useToast } from '../../components/ui/Toast.jsx';
import { useI18n } from '../../context/I18nContext.jsx';
import * as api from '../../api/admin.js';

const STATUS = ['', 'new', 'replied', 'closed'];
const KINDS = ['message', 'complaint', 'suggestion'];
const ROLES = ['visitor', 'patient', 'doctor', 'lab', 'reception'];
const TONE = { new: 'wn', replied: 'ok', closed: 'mu' };

export default function Messages() {
  const { t, fmtDateTime } = useI18n();
  const { act } = useToast();
  const [status, setStatus] = useState('');
  const [kind, setKind] = useState('');
  const [role, setRole] = useState('');
  const state = useAsync(() => api.getMessages({ status, kind, role }), [status, kind, role]);
  const [sel, setSel] = useState(null);      // الرسالة المفتوحة (كاملة)
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [del, setDel] = useState(false);

  const patchRow = useCallback((m) => state.setData((d) => (d ? { ...d, items: d.items.map((x) => (x.id === m.id ? { ...x, ...m, preview: x.preview } : x)) } : d)), [state]);

  const open = async (id) => {
    setText(''); setDel(false);
    const m = await act(() => api.getMessage(id));
    if (m) { setSel(m); patchRow({ ...m, unread: false }); state.setData((d) => (d ? { ...d, unread: Math.max(0, d.unread - (d.items.find((x) => x.id === id)?.unread ? 1 : 0)) } : d)); }
  };
  useEffect(() => { setSel(null); }, [status, kind, role]);

  const reply = async (e) => {
    e.preventDefault();
    if (text.trim().length < 2) return;
    setBusy(true);
    const m = await act(() => api.replyMessage(sel.id, text.trim()), 'adm_toast_replied');
    setBusy(false);
    if (m) { setSel(m); setText(''); patchRow(m); }
  };
  const setSt = async (s) => {
    const m = await act(() => api.setMessageStatus(sel.id, s));
    if (m) { setSel(m); patchRow(m); }
  };
  const remove = async () => {
    const r = await act(() => api.deleteMessage(sel.id));
    if (r) { state.setData((d) => ({ ...d, items: d.items.filter((x) => x.id !== sel.id) })); setSel(null); setDel(false); }
  };

  return (
    <section>
      <h1>{t('adm_msg_title')}</h1>
      <p className="sub">{t('adm_msg_sub')}</p>

      <div className="tabs">
        {STATUS.map((s) => <button type="button" key={s || 'all'} className={status === s ? 'on' : ''} onClick={() => setStatus(s)}>{t(s ? `adm_msg_${s}` : 'adm_msg_all')}</button>)}
      </div>
      <div className="msg-filters">
        <select value={kind} onChange={(e) => setKind(e.target.value)} aria-label={t('adm_msg_kind_all')}>
          <option value="">{t('adm_msg_kind_all')}</option>
          {KINDS.map((k) => <option key={k} value={k}>{t(`ct_k_${k}`)}</option>)}
        </select>
        <select value={role} onChange={(e) => setRole(e.target.value)} aria-label={t('adm_msg_role_all')}>
          <option value="">{t('adm_msg_role_all')}</option>
          {ROLES.map((r) => <option key={r} value={r}>{t(`adm_msg_r_${r}`)}</option>)}
        </select>
      </div>

      <div className="msg-layout">
        <div className="card msg-list">
          <Async state={state}>{(d) => (d.items.length === 0
            ? <div className="state">{t('adm_msg_empty')}</div>
            : d.items.map((m) => (
              <button type="button" key={m.id} className={`msg-row ${sel?.id === m.id ? 'on' : ''} ${m.unread ? 'unread' : ''}`} onClick={() => open(m.id)}>
                <div className="m">
                  <b>{m.subject || m.preview}</b>
                  <small>{m.name || m.email} · {t(`adm_msg_r_${m.role}`)} · {t(`ct_k_${m.kind}`)}</small>
                  <small>{fmtDateTime(m.updatedAt)}</small>
                </div>
                {m.unread && <span className="dot" aria-label={t('adm_msg_new')} />}
                <span className={`badge ${TONE[m.status]}`}>{t(`adm_msg_${m.status}`)}</span>
              </button>
            )))}
          </Async>
        </div>

        <div className="card msg-detail">
          {!sel ? <div className="state"><Icon name="inbox" size={22} /><div>{t('adm_msg_pick')}</div></div> : (
            <>
              <div className="msg-from">
                <h2>{sel.subject || t(`ct_k_${sel.kind}`)}</h2>
                <div className="chips">
                  <span className="badge">{t(`ct_k_${sel.kind}`)}</span>
                  <span className={`badge ${TONE[sel.status]}`}>{t(`adm_msg_${sel.status}`)}</span>
                </div>
                <dl className="msg-meta">
                  <div><dt>{t('adm_msg_from')}</dt><dd>{sel.name || '—'} · {t(`adm_msg_r_${sel.role}`)} · {sel.registered ? t('adm_msg_registered') : t('adm_msg_guest')}</dd></div>
                  <div><dt>{t('adm_msg_email')}</dt><dd dir="ltr">{sel.email}</dd></div>
                  {sel.phone && <div><dt>{t('adm_msg_phone')}</dt><dd dir="ltr">{sel.phone}</dd></div>}
                </dl>
              </div>

              <div className="ct-msg me"><p>{sel.message}</p><small>{sel.name || sel.email} · {fmtDateTime(sel.createdAt)}</small></div>
              {sel.replies.map((r) => (
                <div key={r.id} className={`ct-msg ${r.from === 'admin' ? 'admin' : 'me'}`}>
                  <p>{r.text}</p>
                  <small>{r.from === 'admin' ? `${r.byName || t('adm_msg_admin')} (${t('adm_msg_admin')})` : (sel.name || sel.email)} · {fmtDateTime(r.at)}{r.from === 'admin' && r.emailed ? ` · ${t('adm_msg_emailed')}` : ''}</small>
                </div>
              ))}

              <form onSubmit={reply} noValidate>
                <textarea rows={4} maxLength={2000} value={text} onChange={(e) => setText(e.target.value)} placeholder={t('adm_msg_reply_ph')} />
                <small className="sub">{t(sel.registered ? 'adm_msg_note_user' : 'adm_msg_note_guest')}</small>
                <div className="btn-row">
                  <button type="submit" className="btn" disabled={busy || text.trim().length < 2}>{busy ? t('loading') : t('adm_msg_reply_btn')}</button>
                  {sel.status === 'closed'
                    ? <button type="button" className="btn o" onClick={() => setSt('new')}>{t('adm_msg_reopen')}</button>
                    : <button type="button" className="btn o" onClick={() => setSt('closed')}>{t('adm_msg_close')}</button>}
                  {del
                    ? <button type="button" className="btn dg" onClick={remove}>{t('adm_msg_delete_confirm')}</button>
                    : <button type="button" className="btn o" onClick={() => setDel(true)}><Icon name="trash" size={15} />{t('adm_msg_delete')}</button>}
                </div>
              </form>
            </>
          )}
        </div>
      </div>
    </section>
  );
}
