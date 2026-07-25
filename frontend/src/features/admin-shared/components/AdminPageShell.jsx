import { useState } from "react";
import { useNavigate } from "react-router-dom";
import AdminLayoutShell from "../../../components/admin/AdminLayout";
import { brand } from "../../../constants/brand";
import { logout as logoutAdmin } from "../../../services/authService";
import { navItems, pageTitles, routeToPath } from "../constants/adminNavigation";

export default function AdminPageShell({ children, route = "dashboard" }) {
  const navigateRouter = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const currentRoute = pageTitles[route] ? route : "dashboard";

  const navigate = (nextRoute) => {
    setSidebarOpen(false);
    setSearchQuery("");
    navigateRouter(routeToPath(nextRoute));
  };

  const toggleSidebar = () => {
    if (window.matchMedia("(max-width: 940px)").matches) {
      setSidebarOpen((current) => !current);
      return;
    }
    setSidebarCollapsed((current) => !current);
  };

  return (
    <AdminLayoutShell
      brand={brand}
      currentPage={pageTitles[currentRoute] || pageTitles.dashboard}
      currentRoute={currentRoute}
      navItems={navItems}
      searchQuery={searchQuery}
      sidebarCollapsed={sidebarCollapsed}
      sidebarOpen={sidebarOpen}
      onCloseSidebar={() => setSidebarOpen(false)}
      onNavigate={navigate}
      onNewReservation={() => navigateRouter("/reserva")}
      onSearchChange={setSearchQuery}
      onToggleSidebar={toggleSidebar}
      onLogout={() => {
        logoutAdmin();
        navigateRouter("/admin/login", { replace: true });
      }}
    >
      {typeof children === "function" ? children({ onNavigate: navigate, searchQuery }) : children}
    </AdminLayoutShell>
  );
}
