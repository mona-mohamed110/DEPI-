import { useEffect, useState } from 'react';
import Icon from '../Icon.jsx';
import { useI18n } from '../../context/I18nContext.jsx';
import { isEmail } from '../../api/security.js';
import { sendContact } from '../../api/public.js';

// نموذج التواصل: الرسالة بتتبعت لإيميل الإدارة عن طريق الـ API (POST /public/contact)
export default function ContactModal({ isOpen, onClose }) {
  const { t } = useI18n();
  const [f, setF] = useState({ name: '', email: '', subject: '', message: '' });
  const [state, setState] = useState('idle'); // idle | sending | sent | error

  useEffect(() => {
    if (!isOpen) return undefined;
    const esc = (e) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', esc);
    document.body.style.overflow = 'hidden';
    return () => { document.removeEventListener('keydown', esc); document.body.style.overflow = ''; };
  }, [isOpen, onClose]);

  const set = (k) => (e) => setF((x) => ({ ...x, [k]: e.target.value }));
  const submit = async (e) => {
    e.preventDefault();
    if (f.name.trim().length < 2 || !isEmail(f.email) || f.message.trim().length < 5) return setState('error');
    setState('sending');
    try { await sendContact({ ...f, message: `${f.subject}\n${f.message}`.trim() }); setState('sent'); setF({ name: '', email: '', subject: '', message: '' }); }
    catch { setState('error'); }
  };

  return (
    <div className={`cm-overlay ${isOpen ? 'open' : ''}`} onClick={onClose} aria-hidden={!isOpen}>
      <div className="cm-modal" role="dialog" aria-modal="true" aria-labelledby="cm-title" onClick={(e) => e.stopPropagation()}>
        <button type="button" className="cm-close" onClick={onClose} aria-label={t('close')}><Icon name="x" size={16} /></button>
        <h2 id="cm-title">{t('cm_title')}</h2>
        <p className="sec-sub" style={{ margin: '0 0 18px' }}>{t('cm_sub')}</p>
        <form onSubmit={submit} noValidate>
          <div className="cm-grid">
            <div><label htmlFor="cm-name">{t('cm_name')}</label><input id="cm-name" value={f.name} maxLength={80} onChange={set('name')} autoComplete="name" /></div>
            <div><label htmlFor="cm-email">{t('cm_email')}</label><input id="cm-email" type="email" dir="ltr" value={f.email} onChange={set('email')} autoComplete="email" /></div>
            <div className="full"><label htmlFor="cm-subject">{t('cm_subject')}</label><input id="cm-subject" value={f.subject} maxLength={120} onChange={set('subject')} /></div>
            <div className="full"><label htmlFor="cm-message">{t('cm_msg')}</label><textarea id="cm-message" rows={4} maxLength={2000} placeholder={t('cm_ph')} value={f.message} onChange={set('message')} /></div>
          </div>
          {state === 'error' && <div className="err">{t('cm_err')}</div>}
          {state === 'sent' && <div className="ok-msg">{t('cm_sent')}</div>}
          <button type="submit" className="btn lg wide" disabled={state === 'sending'}>{state === 'sending' ? t('loading') : t('cm_send')}</button>
        </form>
      </div>
    </div>
  );
}
