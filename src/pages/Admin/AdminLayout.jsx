import DashShell from '../../components/shell/DashShell.jsx';
import { adminDict } from '../../i18n/admin.js';
import '../../styles/theme.css';
import '../../styles/admin.css';

const ITEMS = [
  { to: '/admin', end: true, icon: 'activity', key: 'adm_nav_mon' },
  { to: '/admin/licenses', icon: 'badge', key: 'adm_nav_lic' },
  { to: '/admin/accounts', icon: 'users', key: 'adm_nav_acc' },
];
const LINKS = [
  { to: '/admin/profile', icon: 'user', key: 'profile' },
  { to: '/admin/account', icon: 'sliders', key: 'accountSettings' },
];

export default function AdminLayout() {
  return <DashShell root="admin-app" dict={adminDict} items={ITEMS} links={LINKS} />;
}
