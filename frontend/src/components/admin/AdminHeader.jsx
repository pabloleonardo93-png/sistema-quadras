import { Bell, Menu, Moon, Plus, Search, Sun } from "lucide-react";
import { useState } from "react";
import AdminLogo from "./AdminLogo";
import AdminProfile from "./AdminProfile";
import AdminSearch from "./AdminSearch";
import IconButton from "./IconButton";

export default function AdminHeader({
  admin,
  brand,
  currentPage,
  isDarkMode,
  notifications,
  notificationsLoading,
  notificationsOpen,
  onLogout,
  onNavigate,
  onNewReservation,
  onNotificationsToggle,
  onSearchChange,
  onThemeToggle,
  onToggleSidebar,
  searchQuery,
  sidebarCollapsed,
}) {
  const [searchOpen, setSearchOpen] = useState(false);
  const notificationCount = notifications.length;
  const headerTitle = currentPage?.title || "Visão geral";

  return (
    <header className="admin-header">
      <div className="admin-header__brandline">
        <IconButton
          className="admin-header__menu"
          label={sidebarCollapsed ? "Abrir menu lateral" : "Fechar menu lateral"}
          onClick={onToggleSidebar}
        >
          <Menu aria-hidden="true" size={22} />
        </IconButton>

        <AdminLogo brand={brand} />
      </div>

      <div className="admin-header__title">
        <h1>{headerTitle}</h1>
      </div>

      <div className={`admin-header__center${searchOpen ? " is-open" : ""}`}>
        <AdminSearch
          isOpen={searchOpen}
          value={searchQuery}
          onChange={onSearchChange}
        />
      </div>

      <div className="admin-header__actions" aria-label="Ações do painel">
        <IconButton
          className={`admin-header__search-toggle${searchOpen ? " is-active" : ""}`}
          label={searchOpen ? "Ocultar busca" : "Abrir busca"}
          onClick={() => setSearchOpen((current) => !current)}
        >
          <Search aria-hidden="true" size={19} />
        </IconButton>

        <button className="admin-header__new-reservation" type="button" onClick={onNewReservation}>
          <Plus aria-hidden="true" size={18} />
          <span>Nova reserva</span>
        </button>

        <div className="admin-notifications">
          <IconButton
            aria-expanded={notificationsOpen}
            className={notificationsOpen ? "is-active" : ""}
            label="Notificações"
            onClick={onNotificationsToggle}
          >
            <Bell aria-hidden="true" size={20} />
            {notificationCount > 0 && <i>{notificationCount}</i>}
          </IconButton>
          {notificationsOpen && (
            <div className="admin-notifications__panel" role="status">
              <strong>Notificações</strong>
              {notificationsLoading ? (
                <p>Carregando avisos...</p>
              ) : notificationCount ? (
                notifications.map((notification) => (
                  <button
                    key={notification.id}
                    type="button"
                    onClick={() => {
                      onNotificationsToggle(false);
                      onNavigate(notification.route);
                    }}
                  >
                    <span>{notification.title}</span>
                    <small>{notification.description}</small>
                  </button>
                ))
              ) : (
                <p>Nenhuma pendência no momento.</p>
              )}
            </div>
          )}
        </div>

        <IconButton
          aria-pressed={isDarkMode}
          className="admin-header__theme"
          label={isDarkMode ? "Usar modo claro" : "Usar modo escuro"}
          onClick={onThemeToggle}
        >
          {isDarkMode ? <Sun aria-hidden="true" size={20} /> : <Moon aria-hidden="true" size={20} />}
        </IconButton>

        <AdminProfile admin={admin} onLogout={onLogout} />
      </div>
    </header>
  );
}
