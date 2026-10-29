import { Outlet } from "react-router-dom";
import ScrollToHash from "./components/home/ScrollToHash.jsx";
import { useApp } from "./context/AppContext.jsx";

function Layout() {
  const { theme, lang } = useApp();
  return (
    <div data-theme={theme} lang={lang} dir={lang === "ar" ? "rtl" : "ltr"}>
      <ScrollToHash />
      <Outlet />
    </div>
  );
}

export default Layout;