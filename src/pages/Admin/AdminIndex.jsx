import { Navigate } from 'react-router-dom';
import { useAsync } from '../../components/ui/hooks.js';
import { useI18n } from '../../context/I18nContext.jsx';
import * as api from '../../api/admin.js';
import Monitoring from './Monitoring.jsx';

const FIRST = { monitoring: '/admin', licenses: '/admin/licenses', accounts: '/admin/accounts', messages: '/admin/messages', reviews: '/admin/reviews' };

// الصفحة الرئيسية للأدمن: من لا يملك صلاحية المراقبة يُحوَّل لأول صفحة مسموحة له
export default function AdminIndex() {
  const { t } = useI18n();
  const s = useAsync(() => api.getAccess(), []);
  if (s.loading && !s.data) return <div className="state">{t('loading')}</div>;
  const perms = s.data?.perms || ['monitoring'];
  if (perms.includes('monitoring')) return <Monitoring />;
  const next = perms.find((p) => p !== 'monitoring');
  return next ? <Navigate to={FIRST[next]} replace /> : <div className="state">{t('adm_noaccess')}</div>;
}
