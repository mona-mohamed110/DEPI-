import { useI18n } from '../../context/I18nContext.jsx';

// فورم تأكيد بسيط يظهر في نفس الصفحة (بدل نافذة منبثقة). يُستخدم قبل أي حذف أو إجراء حساس.
// الاستخدام: {confirming && <ConfirmForm message="..." onConfirm={...} onCancel={...} />}
export default function ConfirmForm({ message, confirmLabel, cancelLabel, danger = true, busy = false, onConfirm, onCancel, children }) {
  const { t } = useI18n();
  return (
    <form className="confirm-form" role="alertdialog" aria-label={message}
      onSubmit={(e) => { e.preventDefault(); if (!busy) onConfirm(); }}>
      <span className="confirm-msg">{message}</span>
      {children}
      <div className="confirm-actions">
        <button type="submit" className={`btn s ${danger ? 'dg' : ''}`} disabled={busy}>{confirmLabel || t('confirm_delete')}</button>
        <button type="button" className="btn s o" onClick={onCancel}>{cancelLabel || t('cancel')}</button>
      </div>
    </form>
  );
}
