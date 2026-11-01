import { NavLink } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  CalendarPlus, 
  Users, 
} from 'lucide-react';
import './ReceptionSidebar.css';
import logo from "../../assets/logo.png";
import ReceptionSettingsMenu from './ReceptionSettingsMenu.jsx';

export default function ReceptionSidebar() {
  const [isDark, setIsDark] = useState(() => {
    return localStorage.getItem('reception_theme') === 'dark';
  });

  const [lang, setLang] = useState(() => {
    return localStorage.getItem('reception_lang') || 'ar';
  });

  useEffect(() => {
    const checkSettings = () => {
      setIsDark(localStorage.getItem('reception_theme') === 'dark');
      setLang(localStorage.getItem('reception_lang') || 'ar');
    };
    window.addEventListener('storage', checkSettings);
    const interval = setInterval(checkSettings, 300);
    return () => {
      window.removeEventListener('storage', checkSettings);
      clearInterval(interval);
    };
  }, []);

  const translations = {
    ar: {
      dashboard: 'لوحة الاستقبال',
      appointments: 'حجز المواعيد',
      patients: 'بيانات المرضى',
    },
    en: {
      dashboard: 'Reception Dashboard',
      appointments: 'Appointments',
      patients: 'Patients Data',
    }
  };

  const t = translations[lang] || translations.ar;

  const receptionNavItems = [
    { to: '/reception', label: t.dashboard, icon: LayoutDashboard, end: true },
    { to: '/reception/appointments', label: t.appointments, icon: CalendarPlus },
    { to: '/reception/patients', label: t.patients, icon: Users },
  ];

  return (
    <aside className={`reception-sidebar ${isDark ? 'dark-mode' : ''}`}>
      <div className="patient-logo">
        <img src={logo} alt="Shefaa" className="patient-logo-img" />
      </div>

      <nav className="nav">
        {receptionNavItems.map(({ to, label, icon: Icon, end }) => (
          <NavLink 
            key={to} 
            to={to} 
            end={end} 
            className={({ isActive }) => (isActive ? 'on' : '')}
          >
            <Icon size={19} />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>
      <ReceptionSettingsMenu />
    </aside>
  );
}