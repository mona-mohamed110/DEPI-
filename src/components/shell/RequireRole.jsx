import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { ROLE_HOME } from '../../config/env.js';

// حارس الصفحات: لازم تسجيل دخول + الدور المناسب. (السيرفر هو اللي بيفرض الصلاحيات الحقيقية على كل endpoint)
export default function RequireRole({ role, children }) {
  const { user, ready } = useAuth();
  const loc = useLocation();
  if (!ready) return <div style={{ padding: 40, textAlign: 'center', fontFamily: 'Tajawal, sans-serif' }}>…</div>;
  if (!user) return <Navigate to="/login" replace state={{ from: loc.pathname + loc.search }} />;
  if (user.role !== role) return <Navigate to={ROLE_HOME[user.role]} replace />;
  return children;
}
