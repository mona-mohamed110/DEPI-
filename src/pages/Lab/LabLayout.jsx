import DashShell from '../../components/shell/DashShell.jsx';
import { labDict } from '../../i18n/lab.js';
import { LabProvider, useLabBadges } from './LabContext.jsx';
import '../../styles/theme.css';
import '../../styles/lab.css';

const ITEMS = [
  { to: '/lab', end: true, icon: 'flask', key: 'navDashboard' },
  { to: '/lab/add', icon: 'plus', key: 'navAdd' },
  { to: '/lab/details', icon: 'file', key: 'navDetails' },
  { to: '/lab/upload', icon: 'upload', key: 'navUpload' },
  { to: '/lab/results', icon: 'clipboard', key: 'navResults' },
];
const LINKS = [
  { to: '/lab/settings/profile', icon: 'building', key: 'labFile' },
  { to: '/lab/settings/personal', icon: 'user', key: 'profile' },
  { to: '/lab/settings/account', icon: 'sliders', key: 'accountSettings' },
];

export default function LabLayout() {
  return <DashShell root="lab-app" dict={labDict} items={ITEMS} links={LINKS} useBadges={useLabBadges} Provider={LabProvider} />;
}
