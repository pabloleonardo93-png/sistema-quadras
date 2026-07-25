import { useEffect, useMemo, useState } from "react";
import { CalendarDays } from "lucide-react";
import { buscarAdministradorAtual, getAdmin } from "../../services/authService";
import { listarQuadrasAdmin } from "../../services/quadraService";
import { listarReservas } from "../../services/reservaService";
import { QUADRA_STATUS } from "../../shared/constants/adminStatus";
import { RESERVA_STATUS } from "../../shared/constants/reservaStatus";
import AdminHeader from "./AdminHeader";
import AdminSidebar from "./AdminSidebar";

function capitalizeText(value) {
  return String(value || "").replace(/^./, (letter) => letter.toUpperCase());
}

function buildNotifications(reservas = [], quadras = []) {
  const pendentes = reservas.filter((reserva) => reserva.status === RESERVA_STATUS.AGUARDANDO_PAGAMENTO);
  const manutencao = quadras.filter((quadra) => quadra.status === QUADRA_STATUS.MANUTENCAO);

  return [
    ...(pendentes.length
      ? [{
          id: "reservas-pendentes",
          route: "reservas",
          title: `${pendentes.length} pagamento${pendentes.length > 1 ? "s" : ""} pendente${pendentes.length > 1 ? "s" : ""}`,
          description: "Confira as reservas aguardando retorno do Mercado Pago.",
        }]
      : []),
    ...(manutencao.length
      ? [{
          id: "quadras-manutencao",
          route: "quadras",
          title: `${manutencao.length} quadra${manutencao.length > 1 ? "s" : ""} em manutenção`,
          description: manutencao.map((quadra) => quadra.nome).join(", "),
        }]
      : []),
  ];
}

export default function AdminLayout({
  brand,
  children,
  currentPage,
  currentRoute,
  navItems,
  onCloseSidebar,
  onLogout,
  onNavigate,
  onNewReservation,
  onSearchChange,
  onToggleSidebar,
  searchQuery,
  sidebarCollapsed,
  sidebarOpen,
}) {
  const [admin, setAdmin] = useState(() => getAdmin());
  const [isDarkMode, setIsDarkMode] = useState(() => localStorage.getItem("admin-theme") === "dark");
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [notificationsLoading, setNotificationsLoading] = useState(false);
  const dateLabel = useMemo(
    () =>
      capitalizeText(new Intl.DateTimeFormat("pt-BR", {
        day: "2-digit",
        month: "long",
        weekday: "long",
        year: "numeric",
      }).format(new Date())),
    [],
  );

  useEffect(() => {
    localStorage.setItem("admin-theme", isDarkMode ? "dark" : "light");
  }, [isDarkMode]);

  useEffect(() => {
    let active = true;

    buscarAdministradorAtual()
      .then((administrador) => {
        if (active && administrador) setAdmin(administrador);
      })
      .catch(() => {
        if (active) setAdmin((current) => current || getAdmin());
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;

    async function loadNotifications() {
      setNotificationsLoading(true);
      const [reservasResult, quadrasResult] = await Promise.allSettled([
        listarReservas(),
        listarQuadrasAdmin(),
      ]);

      if (!active) return;

      const reservas = reservasResult.status === "fulfilled" ? reservasResult.value : [];
      const quadras = quadrasResult.status === "fulfilled" ? quadrasResult.value : [];
      setNotifications(buildNotifications(reservas, quadras));
      setNotificationsLoading(false);
    }

    void loadNotifications();

    return () => {
      active = false;
    };
  }, [currentRoute]);

  const shellClassName = [
    "admin-shell",
    isDarkMode ? "admin-shell--dark" : "",
    sidebarCollapsed ? "admin-shell--sidebar-collapsed" : "",
  ].filter(Boolean).join(" ");
  const pageTitle = currentPage?.title || "Visão geral";
  const pageDescription = currentPage?.description || "Acompanhe reservas, ocupação e pendências do dia.";
  const pageIntroId = `admin-page-intro-${currentRoute || "dashboard"}`;

  const setNotificationsExpanded = (value) => {
    if (typeof value === "boolean") {
      setNotificationsOpen(value);
      return;
    }
    setNotificationsOpen((current) => !current);
  };

  return (
    <div className={shellClassName}>
      <AdminSidebar
        brand={brand}
        currentRoute={currentRoute}
        navItems={navItems}
        onClose={onCloseSidebar}
        onLogout={onLogout}
        onNavigate={onNavigate}
        open={sidebarOpen}
      />

      {sidebarOpen && <button className="admin-overlay" type="button" aria-label="Fechar menu" onClick={onCloseSidebar} />}

      <div className="admin-main">
        <AdminHeader
          admin={admin}
          brand={brand}
          currentPage={currentPage}
          isDarkMode={isDarkMode}
          notifications={notifications}
          notificationsLoading={notificationsLoading}
          notificationsOpen={notificationsOpen}
          onLogout={onLogout}
          onNavigate={onNavigate}
          onNewReservation={onNewReservation}
          onNotificationsToggle={setNotificationsExpanded}
          onSearchChange={onSearchChange}
          onThemeToggle={() => setIsDarkMode((current) => !current)}
          onToggleSidebar={onToggleSidebar}
          searchQuery={searchQuery}
          sidebarCollapsed={sidebarCollapsed}
        />
        <section className="admin-page-intro" aria-labelledby={pageIntroId}>
          <div>
            <h2 id={pageIntroId}>{pageTitle}</h2>
            <p>{pageDescription}</p>
          </div>
          <small>
            <CalendarDays aria-hidden="true" size={15} />
            <span>{dateLabel}</span>
            <i aria-hidden="true" />
            <span>Atualizado agora</span>
          </small>
        </section>
        {children}
      </div>
    </div>
  );
}
