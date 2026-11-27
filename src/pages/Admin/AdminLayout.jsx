import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import * as api from '../../api/admin.js';
import DashShell from '../../components/shell/DashShell.jsx';
import { adminDict } from '../../i18n/admin.js';
import '../../styles/theme.css';
import '../../styles/admin.css';

const ITEMS = [
  { to: '/admin', end: true, icon: 'activity', key: 'adm_nav_mon' },
  { to: '/admin/licenses', icon: 'badge', key: 'adm_nav_lic' },
  { to: '/admin/accounts', icon: 'users', key: 'adm_nav_acc' },
  { to: '/admin/messages', icon: 'inbox', key: 'adm_nav_msg' },
  { to: '/admin/reviews', icon: 'star', key: 'adm_nav_rev' },
  { to: '/admin/users', icon: 'shield', key: 'adm_nav_users', superOnly: true },
  { to: '/admin/activity', icon: 'clipboard', key: 'adm_nav_log', superOnly: true },
  { to: '/admin/email-design', icon: 'mail', key: 'adm_nav_email', superOnly: true },
];
const PAGE_OF = { adm_nav_mon: 'monitoring', adm_nav_lic: 'licenses', adm_nav_acc: 'accounts', adm_nav_msg: 'messages', adm_nav_rev: 'reviews' };
const LINKS = [
  { to: '/admin/profile', icon: 'user', key: 'profile' },
  { to: '/admin/account', icon: 'sliders', key: 'accountSettings' },
];

// عدد الرسائل غير المقروءة بجانب "الرسائل والشكاوى"
function useAdminBadges() {
  const { pathname } = useLocation();
  const [n, setN] = useState(0);
  useEffect(() => {
    let live = true;
    api.getMessageCount().then((r) => { if (live) setN(r.count || 0); }).catch(() => {});
    return () => { live = false; };
  }, [pathname]);
  return { adm_nav_msg: n };
}

export default function AdminLayout() {
  const [acc, setAcc] = useState(null);
  useEffect(() => { api.getAccess().then(setAcc).catch(() => setAcc({ sub: true, perms: [] })); }, []);
  // الأدمن الرئيسي يرى كل شيء؛ المستخدم الفرعي يرى صفحاته المسموحة فقط
  const items = !acc ? [] : ITEMS.filter((i) => (i.superOnly ? !acc.sub : acc.perms.includes(PAGE_OF[i.key])));
  return <DashShell root="admin-app" dict={adminDict} items={items} links={LINKS} useBadges={useAdminBadges} />;
}
