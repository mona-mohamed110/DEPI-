import { useState } from "react";
import { NavLink, Outlet } from "react-router-dom";
import { Activity, BadgeCheck, Users } from "lucide-react";
import { useApp } from "../../context/AppContext.jsx";
import AdminSettingsMenu from "./AdminSettingsMenu.jsx";
import logo from "../../assets/logo.png";
import "../Style/Admin/AdminLayout.css";

function AdminLayout() {
  const { theme, lang } = useApp();
  const [admin, setAdmin] = useState({
    name: "مدير النظام",
    email: "admin@shefaa.com",
  });

  return (
    <div
      className="admin-layout"
      data-theme={theme}
      lang={lang}
      dir={lang === "ar" ? "rtl" : "ltr"}
    >
      <aside className="admin-sidebar">
        <div className="admin-logo">
          <img src={logo} alt="logo" />
          <span>{admin.name}</span>
        </div>

        <NavLink to="/admin" end><Activity size={19} /> أداء النظام والتقارير</NavLink>
        <NavLink to="/admin/licenses"><BadgeCheck size={19} /> التحقق من التراخيص</NavLink>
        <NavLink to="/admin/accounts"><Users size={19} /> إدارة الحسابات</NavLink>

        <AdminSettingsMenu admin={admin} />
      </aside>

      <main className="admin-main">
        <Outlet context={{ admin, setAdmin }} />
      </main>
    </div>
  );
}

export default AdminLayout;