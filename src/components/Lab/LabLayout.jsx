import { Outlet } from "react-router-dom";
import { LabProvider, useLab } from "../../context/LabContext";
import LabSidebar from "./LabSidebar";
import "../../components/Style/Lab/lab.css";

function Shell() {
  const { lang, theme, toastMsg } = useLab();
  return (
    <div className="lab-app" data-theme={theme} dir={lang === "ar" ? "rtl" : "ltr"} lang={lang}>
      <LabSidebar />
      <main className="lb-main"><Outlet /></main>
      <div className={`lb-toast ${toastMsg ? "show" : ""}`} role="status">{toastMsg}</div>
    </div>
  );
}

export default function LabLayout() {
  return <LabProvider><Shell /></LabProvider>;
}
