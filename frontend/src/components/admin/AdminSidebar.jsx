import { LogOut, X } from "lucide-react";

export default function AdminSidebar({
  brand,
  currentRoute,
  navItems,
  onClose,
  onLogout,
  onNavigate,
  open,
}) {
  return (
    <aside className={`admin-sidebar ${open ? "admin-sidebar--open" : ""}`}>
      <div className="admin-sidebar__top">
        <a className="admin-logo" href="/" aria-label={brand.name}>
          <img src="/images/logo/logo-pe-na-areia-favicon-blue.png" alt="" aria-hidden="true" />
          <span>{brand.nameUpper}</span>
        </a>
        <button className="admin-sidebar__close" type="button" aria-label="Fechar menu" onClick={onClose}>
          <X aria-hidden="true" size={20} />
        </button>
      </div>

      <nav className="admin-nav" aria-label="Menu administrativo">
        {navItems.map(({ icon: Icon, id, label }) => (
          <button
            className={currentRoute === id ? "is-active" : ""}
            key={id}
            type="button"
            onClick={() => onNavigate(id)}
          >
            <Icon aria-hidden="true" size={21} />
            <span>{label}</span>
          </button>
        ))}
      </nav>

      <div className="admin-sidebar__footer">
        <button type="button" onClick={onLogout}>
          <LogOut aria-hidden="true" size={20} />
          <span>Sair</span>
        </button>
      </div>
    </aside>
  );
}
