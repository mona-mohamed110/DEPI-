import { Outlet } from 'react-router-dom';
import DoctorSidebar from './DoctorSidebar.jsx';
import { DoctorProvider, useDoctor } from '../../context/DoctorContext.jsx';
import '../Style/Doctor/doctor.css';

function Shell() {
  const { theme, lang, toastMsg } = useDoctor();
  return (
    <div className="doctor" data-theme={theme} lang={lang} dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      <div className="d-app">
        <DoctorSidebar />
        <main className="d-main">
          <Outlet />
        </main>
      </div>
      <div className={`d-toast ${toastMsg ? 'show' : ''}`}>{toastMsg}</div>
    </div>
  );
}

export default function DoctorLayout() {
  return (
    <DoctorProvider>
      <Shell />
    </DoctorProvider>
  );
}
