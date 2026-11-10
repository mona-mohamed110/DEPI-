import { useLocation, useNavigate } from 'react-router-dom';
import Icon from '../../components/Icon.jsx';
import { useI18n } from '../../context/I18nContext.jsx';
import { usePatient } from './PatientContext.jsx';

// زرّين في أعلى صفحة التحاليل: "التحاليل المطلوبة" (صفحة جديدة) و"نتائج التحاليل"
export default function ResultsTabs() {
  const { t, num } = useI18n();
  const { labCount } = usePatient();
  const nav = useNavigate();
  const { pathname } = useLocation();
  const requested = pathname.startsWith('/patient/results/requested');
  return (
    <div className="tabs" role="tablist">
      <button type="button" role="tab" aria-selected={requested} className={requested ? 'on' : ''} onClick={() => nav('/patient/results/requested')}>
        <Icon name="clipboardPlus" size={16} />{t('res_tab_requested')}{labCount > 0 && <b className="tab-count">{num(labCount)}</b>}
      </button>
      <button type="button" role="tab" aria-selected={!requested} className={!requested ? 'on' : ''} onClick={() => nav('/patient/results')}>
        <Icon name="tube" size={16} />{t('res_tab_results')}
      </button>
    </div>
  );
}
