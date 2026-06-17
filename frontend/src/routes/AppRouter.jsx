import { AdminPanel } from "../pages/admin/AdminPanel";
import { PublicSite } from "../pages/PublicSite";

export function AppRouter() {
  if (window.location.pathname.startsWith("/admin")) {
    return <AdminPanel />;
  }

  return <PublicSite />;
}