import { useState } from 'react';
import { Link } from 'react-router-dom';
import Icon from '../Icon.jsx';
import PrefsMenu from './PrefsMenu.jsx';
import { useI18n } from '../../context/I18nContext.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { ROLE_HOME } from '../../config/env.js';
import BrandLogo from '../BrandLogo.jsx';

export default function Navbar() {
  const { t } = useI18n();
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);
  return (
    <nav className="navbar">
      <Link to="/" className="nav-brand" onClick={close}><BrandLogo /></Link>
      <div className={`nav-content ${open ? 'active' : ''}`}>
        <ul className="nav-links">
          <li><Link to="/" onClick={close}>{t('nav_home')}</Link></li>
          <li><Link to="/#services" onClick={close}>{t('nav_services')}</Link></li>
          <li><Link to="/#about" onClick={close}>{t('nav_about')}</Link></li>
          <li><Link to="/#how-it-works" onClick={close}>{t('nav_how')}</Link></li>
        </ul>
        <div className="nav-actions">
          {user ? <Link to={ROLE_HOME[user.role]} className="btn" onClick={close}>{t('nav_dashboard')}</Link> : (
            <>
              <Link to="/login" className="btn" onClick={close}>{t('nav_login')}</Link>
              <Link to="/register" className="btn o" onClick={close}>{t('nav_register')}</Link>
            </>
          )}
        </div>
      </div>
      <div className="nav-tools">
        <PrefsMenu />
        <button type="button" className="menu-toggle" aria-label={t('nav_menu')} aria-expanded={open} onClick={() => setOpen((o) => !o)}><Icon name={open ? 'x' : 'menu'} size={22} /></button>
      </div>
    </nav>
  );
}
