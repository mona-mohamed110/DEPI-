import { Outlet } from 'react-router-dom';
import { useState, useEffect } from 'react';
import ReceptionSidebar from './ReceptionSidebar';
import './ReceptionLayout.css';

export default function ReceptionLayout() {
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

  return (
    <div className={`reception-layout-container ${isDark ? 'dark-mode' : ''}`} dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      <ReceptionSidebar />
      <main className="reception-main-content">
        <Outlet />
      </main>
    </div>
  );
}
