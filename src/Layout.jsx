import { Outlet } from "react-router-dom";
import ScrollToHash from "./components/ScrollToHash";

function Layout() {
  return (
    <>
      <ScrollToHash />
      <Outlet />
    </>
  );
}

export default Layout;