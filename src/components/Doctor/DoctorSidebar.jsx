import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Users, FolderHeart, ClipboardPlus } from 'lucide-react';
import { useDoctor } from '../../context/DoctorContext.jsx';
import DoctorSettingsMenu from './DoctorSettingsMenu.jsx';
import logo from '../../assets/logo.png';

export const doctorNavItems = [
  { to: '/doctor', key: 'nav_dash', icon: LayoutDashboard, end: true },
  { to: '/doctor/patients', key: 'nav_pts', icon: Users },
  { to: '/doctor/patient-file', key: 'nav_rec', icon: FolderHeart },
  { to: '/doctor/exam', key: 'nav_exam', icon: ClipboardPlus },
];

export default function DoctorSidebar() {
  const { t } = useDoctor();
  return (
    <aside className="d-sidebar">
      <div className="d-logo">
        <img src={logo} alt="Shefaa" className="d-logo-img" />
      </div>
      <nav className="d-nav">
        {doctorNavItems.map(({ to, key, icon: Icon, end }) => (
          <NavLink key={to} to={to} end={end} className={({ isActive }) => (isActive ? 'on' : '')}>
            <Icon size={19} />
            <span>{t(key)}</span>
          </NavLink>
        ))}
      </nav>
      <DoctorSettingsMenu />
    </aside>
  );
}
