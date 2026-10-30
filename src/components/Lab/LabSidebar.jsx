import { NavLink } from "react-router-dom";
import { useLab } from "../../context/LabContext";
import Icon from "./Icon";
import LabSettingsMenu from "./LabSettingsMenu";
import logo from "../../assets/logo.png";

const ITEMS = [
  { to: "/lab", end: true, icon: "flask", key: "navDashboard", badge: true },
  { to: "/lab/add", icon: "plus", key: "navAdd" },
  { to: "/lab/details", icon: "file", key: "navDetails" },
  { to: "/lab/upload", icon: "upload", key: "navUpload" },
  { to: "/lab/results", icon: "clipboard", key: "navResults" },
];

export default function LabSidebar() {
  const { t, counts, num } = useLab();
  return (
    <aside className="lb-side">
      <div className="lb-logo"><img src={logo} alt="SHEFAA" /></div>
      <nav className="lb-nav">
        {ITEMS.map((i) => (
          <NavLink key={i.to} to={i.to} end={i.end} className={({ isActive }) => (isActive ? "on" : "")}>
            <Icon name={i.icon} />
            <span>{t(i.key)}</span>
            {i.badge && counts.new > 0 && <b className="lb-tag">{num(counts.new)}</b>}
          </NavLink>
        ))}
      </nav>
      <div className="lb-side-foot"><LabSettingsMenu /></div>
    </aside>
  );
}
