import { useI18n } from '../../context/I18nContext.jsx';

export const Loading = () => { const { t } = useI18n(); return <div className="state">{t('loading')}</div>; };
export const Empty = ({ text }) => { const { t } = useI18n(); return <div className="state">{text || t('no_results')}</div>; };
export const ErrorBox = ({ onRetry }) => {
  const { t } = useI18n();
  return <div className="state err">{t('error')} {onRetry && <button type="button" className="btn s o" onClick={onRetry}>{t('retry')}</button>}</div>;
};
// يعرض تحميل/خطأ ثم المحتوى
export function Async({ state, children }) {
  if (state.loading && !state.data) return <Loading />;
  if (state.error && !state.data) return <ErrorBox onRetry={state.reload} />;
  return children(state.data);
}
