import { Fragment } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { I18nProvider, useI18n } from '../../context/I18nContext.jsx';
import { usePrefs } from '../../context/PrefsContext.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { ToastProvider, ToastView } from '../ui/Toast.jsx';
import SettingsMenu from './SettingsMenu.jsx';
import Icon from '../Icon.jsx';
import BrandLogo from '../BrandLogo.jsx';

// الهيكل المشترك لكل اللوحات (lab / patient / doctor / reception / admin): سايدبار + محتوى + توست
// root: اسم الكلاس الجذري لكل جزء (مثلاً lab-app) — كل جزء له ملف CSS خاص به
function Frame({ root, items, links, badges = {}, children }) {
  const { t, L, num } = useI18n();
  const { theme, lang } = usePrefs();
  const { user } = useAuth();
  const name = L(user?.name);
  return (
    <div className={`app-root ${root}`} data-theme={theme} dir={lang === 'ar' ? 'rtl' : 'ltr'} lang={lang}>
      <aside className="side">
        <div className="logo">
          <BrandLogo />
          {name && <div className="user" title={name}>{name}</div>}
        </div>
        <nav className="nav" aria-label="main">
          {items.map((i) => (
            <NavLink key={i.to} to={i.to} end={i.end} className={({ isActive }) => (isActive ? 'on' : '')}>
              <Icon name={i.icon} /><span>{t(i.key)}</span>
              {badges[i.key] > 0 && <b className="tag">{num(badges[i.key])}</b>}
            </NavLink>
          ))}
        </nav>
        <div className="side-foot"><SettingsMenu links={links} /></div>
      </aside>
      <main className="main">{children}</main>
      <ToastView />
    </div>
  );
}

export default function DashShell({ root, dict, items, links, useBadges, Provider = Fragment, children }) {
  return (
    <I18nProvider dict={dict}>
      <ToastProvider>
        <Provider>
          <Inner root={root} items={items} links={links} useBadges={useBadges}>{children}</Inner>
        </Provider>
      </ToastProvider>
    </I18nProvider>
  );
}

function Inner({ root, items, links, useBadges, children }) {
  const badges = useBadges ? useBadges() : {};
  return <Frame root={root} items={items} links={links} badges={badges}>{children || <Outlet />}</Frame>;
}
