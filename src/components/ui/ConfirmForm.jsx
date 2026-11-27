import { useI18n } from '../../context/I18nContext.jsx';

// فورم تأكيد بسيط يظهر في نفس الصفحة (بدل نافذة منبثقة). يُستخدم قبل أي حذف أو إجراء حساس.
// الاستخدام: {confirming && <ConfirmForm message="..." onConfirm={...} onCancel={...} />}
export default function ConfirmForm({ message, confirmLabel, cancelLabel, danger = true, busy = false, onConfirm, onCancel, children }) {
  const { t } = useI18n();
  return (
    // div وليس form: بعض الصفحات تضعه داخل نموذج آخر، والنماذج المتداخلة تعيد تحميل الصفحة ولا تنفّذ التأكيد
    <div className="confirm-form" role="alertdialog" aria-label={message}>
      <span className="confirm-msg">{message}</span>
      {children}
      <div className="confirm-actions">
        <button type="button" className={`btn s ${danger ? 'dg' : ''}`} disabled={busy} onClick={() => { if (!busy) onConfirm(); }}>{confirmLabel || t('confirm_delete')}</button>
        <button type="button" className="btn s o" onClick={onCancel}>{cancelLabel || t('cancel')}</button>
      </div>
    </div>
  );
}
