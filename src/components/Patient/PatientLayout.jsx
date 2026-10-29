import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar.jsx';
import { useApp } from '../../context/AppContext.jsx';
import '../Style/Patient/patient.css';

export default function PatientLayout() {
  const { theme, lang, toastMsg } = useApp();
  return (
    <div className="patient" data-theme={theme} lang={lang} dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      <div className="app">
        <Sidebar />
        <main>
          <Outlet />
        </main>
      </div>
      <div className={`toast ${toastMsg ? 'show' : ''}`}>{toastMsg}</div>
    </div>
  );
}