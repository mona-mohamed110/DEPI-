import DashShell from '../../components/shell/DashShell.jsx';
import { receptionDict } from '../../i18n/reception.js';
import { ReceptionProvider, useReceptionBadges } from './ReceptionContext.jsx';
import '../../styles/theme.css';
import '../../styles/reception.css';

const ITEMS = [
  { to: '/reception', end: true, icon: 'dashboard', key: 'nav_dash' },
  { to: '/reception/appointments', icon: 'calendarPlus', key: 'nav_appts' },
  { to: '/reception/patients', icon: 'users', key: 'nav_pts' },
];
const LINKS = [
  { to: '/reception/profile', icon: 'user', key: 'profile' },
  { to: '/reception/account', icon: 'sliders', key: 'accountSettings' },
];

export default function ReceptionLayout() {
  return <DashShell root="reception-app" dict={receptionDict} items={ITEMS} links={LINKS} Provider={ReceptionProvider} useBadges={useReceptionBadges} />;
}
