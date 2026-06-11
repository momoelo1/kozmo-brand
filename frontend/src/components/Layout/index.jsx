import { Outlet, useLocation } from "react-router-dom";
import Sidebar from "../Sidebar";
import BottomNav from "../BottomNav";
import "./index.scss";
const Layout = () => {
  const location = useLocation();
  const isAuthPage =
    location.pathname === "/login" ||
    location.pathname === "/subscribe";
  const isHome = location.pathname === "/";

  return (
    <div>
      <Sidebar />
      {isHome && (
        <>
          <div
            id="home-left-sidebar"
            className="home-left-sidebar"
            aria-label="Category filters"
          />
        </>
      )}
      <div
        className={`page ${isAuthPage ? "auth-page" : ""} ${isHome ? "home-page" : ""}`}
      >
        <Outlet />
      </div>
<BottomNav />
    </div>
  );
};

export default Layout;
