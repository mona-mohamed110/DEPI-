import { useEffect } from "react";
import { Outlet } from "react-router-dom";
import { LabProvider, useLab } from "../../context/LabContext";
import LabSidebar from "./LabSidebar";
import "../../components/Style/Lab/lab.css";

function Shell() {
  const { lang, theme, toastMsg } = useLab();

  // يقلب الصفحة كلها (html) مع اللغة، ويرجعها زي ما كانت لما تخرج من لوحة المعمل
  useEffect(() => {
    const el = document.documentElement;
    const prevDir = el.getAttribute("dir");
    const prevLang = el.getAttribute("lang");
    el.setAttribute("dir", lang === "ar" ? "rtl" : "ltr");
    el.setAttribute("lang", lang);
    return () => {
      prevDir ? el.setAttribute("dir", prevDir) : el.removeAttribute("dir");
      prevLang ? el.setAttribute("lang", prevLang) : el.removeAttribute("lang");
    };
  }, [lang]);

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
