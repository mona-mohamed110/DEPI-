import DashShell from '../../components/shell/DashShell.jsx';
import { patientDict } from '../../i18n/patient.js';
import { PatientProvider, usePatientBadges } from './PatientContext.jsx';
import '../../styles/theme.css';
import '../../styles/patient.css';

const ITEMS = [
  { to: '/patient', end: true, icon: 'dashboard', key: 'nav_dash' },
  { to: '/patient/file', icon: 'folder', key: 'nav_file' },
  { to: '/patient/prescriptions', icon: 'pill', key: 'nav_rx' },
  { to: '/patient/results', icon: 'tube', key: 'nav_res' },
  { to: '/patient/triage', icon: 'bot', key: 'nav_ai' },
  { to: '/patient/booking', icon: 'calendarPlus', key: 'nav_book' },
  { to: '/patient/appointments', icon: 'calendarCheck', key: 'nav_appts' },
  { to: '/patient/permissions', icon: 'shield', key: 'nav_perm' },
];
const LINKS = [
  { to: '/patient/profile', icon: 'user', key: 'profile' },
  { to: '/patient/account', icon: 'sliders', key: 'accountSettings' },
];

export default function PatientLayout() {
  return <DashShell root="patient-app" dict={patientDict} items={ITEMS} links={LINKS} Provider={PatientProvider} useBadges={usePatientBadges} />;
}
