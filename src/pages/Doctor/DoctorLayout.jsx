import DashShell from '../../components/shell/DashShell.jsx';
import { doctorDict } from '../../i18n/doctor.js';
import '../../styles/theme.css';
import '../../styles/doctor.css';

const ITEMS = [
  { to: '/doctor', end: true, icon: 'dashboard', key: 'nav_dash' },
  { to: '/doctor/patients', icon: 'users', key: 'nav_pts' },
  { to: '/doctor/patient-file', icon: 'folder', key: 'nav_rec' },
  { to: '/doctor/exam', icon: 'clipboardPlus', key: 'nav_exam' },
];
const LINKS = [
  { to: '/doctor/profile', icon: 'user', key: 'profile' },
  { to: '/doctor/professional', icon: 'badge', key: 'prof_profile' },
  { to: '/doctor/schedule', icon: 'calendar', key: 'schedule' },
  { to: '/doctor/team', icon: 'users', key: 'nav_team' },
  { to: '/doctor/account', icon: 'sliders', key: 'accountSettings' },
];

export default function DoctorLayout() {
  return <DashShell root="doctor-app" dict={doctorDict} items={ITEMS} links={LINKS} />;
}
