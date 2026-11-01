import { useState } from "react";
import { NavLink, Outlet } from "react-router-dom";
import { Activity, BadgeCheck, Users } from "lucide-react";
import { useApp } from "../../context/AppContext.jsx";
import AdminSettingsMenu from "./AdminSettingsMenu.jsx";
import logo from "../../assets/logo.png";
import "../Style/Admin/AdminLayout.css";

function AdminLayout() {
  const { theme, lang, t } = useApp();

  // الاسم فاضي = الاسم الافتراضي، وبيترجم مع اللغة
  const [saved, setSaved] = useState({
    name: "",
    email: "admin@shefaa.com",
  });

  const admin = {
    name: saved.name || t("adm_name"),
    email: saved.email,
  };

  function setAdmin(next) {
    setSaved({
      name: next.name === t("adm_name") ? "" : next.name,
      email: next.email,
    });
  }

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

        <NavLink to="/admin" end><Activity size={19} /> {t("adm_nav_mon")}</NavLink>
        <NavLink to="/admin/licenses"><BadgeCheck size={19} /> {t("adm_nav_lic")}</NavLink>
        <NavLink to="/admin/accounts"><Users size={19} /> {t("adm_nav_acc")}</NavLink>

        <AdminSettingsMenu />
      </aside>

      <main className="admin-main">
        <Outlet context={{ admin, setAdmin }} />
      </main>
    </div>
  );
}

export default AdminLayout;