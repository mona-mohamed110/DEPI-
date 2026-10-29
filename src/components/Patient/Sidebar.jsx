import { NavLink } from 'react-router-dom';
import { Home, FolderHeart, Pill, FlaskConical, Bot, CalendarPlus, CalendarCheck, ShieldCheck, Stethoscope } from 'lucide-react';
import { useApp } from '../../context/AppContext.jsx';
import SettingsMenu from './SettingsMenu.jsx';
import logo from '../../assets/logo.png';

export const navItems = [
  { to: '/patient', key: 'nav_dash', icon: Home, end: true },
  { to: '/patient/medical-file', key: 'nav_file', icon: FolderHeart },
  { to: '/patient/prescriptions', key: 'nav_rx', icon: Pill },
  { to: '/patient/results', key: 'nav_res', icon: FlaskConical },
  { to: '/patient/symptom-triage', key: 'nav_ai', icon: Bot },
  { to: '/patient/book', key: 'nav_book', icon: CalendarPlus },
  { to: '/patient/appointments', key: 'nav_appts', icon: CalendarCheck },
  { to: '/patient/permissions', key: 'nav_perm', icon: ShieldCheck },
];

export default function Sidebar() {
  const { t } = useApp();
  return (
    <aside className="sidebar">
<div className="patient-logo">
  <img src={logo} alt="Shefaa" className="patient-logo-img" />
</div>
      <nav className="nav">
        {navItems.map(({ to, key, icon: Icon, end }) => (
          <NavLink key={to} to={to} end={end} className={({ isActive }) => (isActive ? 'on' : '')}>
            <Icon size={19} />
            <span>{t(key)}</span>
          </NavLink>
        ))}
      </nav>
      <SettingsMenu />
    </aside>
  );
}
