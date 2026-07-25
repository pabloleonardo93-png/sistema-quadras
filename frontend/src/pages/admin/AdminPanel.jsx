import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  AlertTriangle,
  Archive,
  BarChart3,
  Bell,
  CalendarCheck,
  Check,
  ChevronRight,
  Clock3,
  Eye,
  EyeOff,
  Filter,
  LayoutDashboard,
  LockKeyhole,
  LogOut,
  Mail,
  Megaphone,
  Menu,
  Moon,
  Plus,
  Search,
  ShieldCheck,
  Sun,
  UsersRound,
  LayoutGrid,
  X,
} from "lucide-react";
import { getCourtImage } from "../../constants/courtImages";
import {
  login as loginAdmin,
  logout as logoutAdmin,
} from "../../services/authService";
import {
  arquivarComunicado,
  listarComunicados,
  publicarComunicado,
} from "../../services/comunicadoService";
import {
  alterarStatusCliente,
  listarClientes,
} from "../../services/clienteService";
import {
  alterarStatusModalidade,
  listarModalidades,
} from "../../services/modalidadeService";
import {
  alterarStatusQuadra,
  atualizarQuadra,
  criarQuadra,
  listarQuadrasAdmin,
} from "../../services/quadraService";
import {
  cancelarReserva,
  confirmarReserva,
  finalizarReserva,
  listarReservas,
} from "../../services/reservaService";
import {
  bloquearHorario,
  liberarHorario,
  listarHorarios,
} from "../../services/horarioService";
import {
  buscarDashboard,
  buscarRelatorioFunilReserva,
  buscarRelatorioModalidades,
  buscarRelatorioReservas,
} from "../../services/relatorioService";
import { brand } from "../../constants/brand";

const navItems = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "reservas", label: "Reservas", icon: CalendarCheck },
  { id: "quadras", label: "Quadras", icon: LayoutGrid },
  { id: "modalidades", label: "Modalidades", icon: BarChart3 },
  { id: "horarios", label: "Horários", icon: Clock3 },
  { id: "clientes", label: "Clientes", icon: UsersRound },
  { id: "comunicados", label: "Comunicados", icon: Megaphone },
  { id: "relatorios", label: "Relatórios", icon: BarChart3 },
];

const pageTitles = {
  dashboard: {
    eyebrow: "Painel de operação",
    title: "Visão geral",
    description: "Resumo visual das reservas, ocupação e alertas do dia.",
  },
  reservas: {
    eyebrow: "Gestão de reservas",
    title: "Reservas",
    description: "Acompanhe solicitações, confirmações, cancelamentos e finalizações.",
  },
  quadras: {
    eyebrow: "Estrutura",
    title: "Quadras",
    description: "Gerencie status, modalidades, valores e imagens das quadras.",
  },
  modalidades: {
    eyebrow: "Modalidades",
    title: "Modalidades",
    description: "Gerencie esportes disponíveis, descrições e status.",
  },
  horarios: {
    eyebrow: "Grade operacional",
    title: "Horários",
    description: "Visualize janelas livres, reservadas e bloqueadas.",
  },
  clientes: {
    eyebrow: "Relacionamento",
    title: "Clientes",
    description: "Consulte histórico, contatos e situação dos jogadores.",
  },
  comunicados: {
    eyebrow: "Comunicação",
    title: "Comunicados",
    description: "Prepare promoções, avisos de manutenção e regras do complexo.",
  },
  relatorios: {
    eyebrow: "Indicadores",
    title: "Relatórios",
    description: "Dados reais para leitura rápida do desempenho do complexo.",
  },
};

function routeToPath(route) {
  if (route === "login") return "/admin/login";
  if (route === "dashboard") return "/admin/dashboard";
  return `/admin/${route}`;
}

function statusReserva(status) {
  const labels = {
    aguardando_pagamento: "Aguardando pagamento",
    confirmada: "Confirmada",
    cancelada: "Cancelada",
    expirada: "Expirada",
    finalizada: "Finalizada",
  };
  return labels[status] || status || "--";
}

function statusPagamento(status) {
  const labels = {
    pendente: "Pendente",
    aprovado: "Aprovado",
    recusado: "Recusado",
    cancelado: "Cancelado",
    estornado: "Estornado",
  };
  return labels[status] || status || "--";
}

function statusQuadra(status) {
  const labels = {
    ativa: "Ativa",
    manutencao: "Manutenção",
    inativa: "Inativa",
  };
  return labels[status] || status || "--";
}

function statusHorario(status) {
  const labels = {
    disponivel: "Livre",
    reservado: "Reservado",
    bloqueado: "Bloqueado",
  };
  return labels[status] || status || "--";
}

function statusHorarioClasse(status) {
  const classes = {
    disponivel: "livre",
    reservado: "reservado",
    bloqueado: "bloqueado",
  };
  return classes[status] || "livre";
}

function formatarDataAdmin(data) {
  const [ano, mes, dia] = String(data || "").slice(0, 10).split("-");
  if (!ano || !mes || !dia) return data || "--";
  return `${dia}/${mes}/${ano}`;
}

function obterDataAdmin(data) {
  const [ano, mes, dia] = String(data || "").slice(0, 10).split("-").map(Number);
  if (!ano || !mes || !dia) return null;
  const dataLocal = new Date(ano, mes - 1, dia);
  return Number.isNaN(dataLocal.getTime()) ? null : dataLocal;
}

function formatarDataISOAdmin(data = new Date()) {
  const ano = data.getFullYear();
  const mes = String(data.getMonth() + 1).padStart(2, "0");
  const dia = String(data.getDate()).padStart(2, "0");
  return `${ano}-${mes}-${dia}`;
}

function encontrarDataPadraoAgenda(datas = []) {
  const hoje = formatarDataISOAdmin();
  return datas.find((data) => data >= hoje) || datas[0] || "";
}

function formatarDataReservaAdmin(data) {
  const dataLocal = obterDataAdmin(data);
  if (!dataLocal) {
    const valor = data || "--";
    return {
      day: "--",
      full: valor,
      month: valor,
      weekday: "Data",
      year: "",
    };
  }

  const weekday = new Intl.DateTimeFormat("pt-BR", { weekday: "short" })
    .format(dataLocal)
    .replace(/\.$/, "");
  const month = new Intl.DateTimeFormat("pt-BR", { month: "short" })
    .format(dataLocal)
    .replace(/\.$/, "");

  return {
    day: new Intl.DateTimeFormat("pt-BR", { day: "2-digit" }).format(dataLocal),
    full: new Intl.DateTimeFormat("pt-BR", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    }).format(dataLocal),
    month,
    weekday,
    year: new Intl.DateTimeFormat("pt-BR", { year: "numeric" }).format(dataLocal),
  };
}

function formatarHoraAdmin(hora) {
  return String(hora || "").slice(0, 5) || "--";
}

function formatarValorQuadra(valor) {
  return Number(valor || 0).toFixed(2).replace(".", ",");
}

function normalizarValorQuadra(valor) {
  const texto = String(valor ?? "").trim();
  if (!texto) return null;
  const numero = Number(texto.replace(/\./g, "").replace(",", "."));
  return Number.isFinite(numero) && numero >= 0 ? numero : null;
}

function normalizarBusca(valor) {
  return String(valor || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function dadosQuadraParaAtualizacao(quadra, valorHora) {
  return {
    nome: quadra.nome,
    descricao: quadra.descricao || "",
    valorHora,
    imagemUrl: quadra.imagemUrl || "",
    modalidadesIds: (quadra.modalidades || []).map((modalidade) => modalidade.id),
  };
}

const cadastroQuadraInicial = {
  nome: "",
  descricao: "",
  valorHora: "",
  imagemUrl: "",
  modalidadesIds: [],
};

function statusComunicado(status) {
  const labels = {
    rascunho: "Rascunho",
    publicado: "Publicado",
    arquivado: "Arquivado",
  };
  return labels[status] || status || "--";
}

function AdminState({ error, isLoading, empty, loadingText, emptyText }) {
  if (isLoading) return <p className="admin-muted">{loadingText}</p>;
  if (error) return <p className="admin-error">{error}</p>;
  if (empty) return <p className="admin-muted">{emptyText}</p>;
  return null;
}

function montarNotificacoesAdmin(reservas = [], quadras = []) {
  const pendentes = reservas.filter((reserva) => reserva.status === "aguardando_pagamento");
  const manutencao = quadras.filter((quadra) => quadra.status === "manutencao");

  return [
    ...(pendentes.length
      ? [{
          id: "reservas-pendentes",
          route: "reservas",
          title: `${pendentes.length} pagamento${pendentes.length > 1 ? "s" : ""} pendente${pendentes.length > 1 ? "s" : ""}`,
          description: "Confira as reservas antes de confirmar os horarios.",
        }]
      : []),
    ...(manutencao.length
      ? [{
          id: "quadras-manutencao",
          route: "quadras",
          title: `${manutencao.length} quadra${manutencao.length > 1 ? "s" : ""} em manutencao`,
          description: manutencao.map((quadra) => quadra.nome).join(", "),
        }]
      : []),
  ];
}

export function AdminPanel({ route = "dashboard" }) {
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
    <AdminLayout
      currentRoute={currentRoute}
      searchQuery={searchQuery}
      sidebarCollapsed={sidebarCollapsed}
      sidebarOpen={sidebarOpen}
      onCloseSidebar={() => setSidebarOpen(false)}
      onNavigate={navigate}
      onSearchChange={setSearchQuery}
      onToggleSidebar={toggleSidebar}
      onLogout={() => {
        logoutAdmin();
        navigateRouter("/admin/login", { replace: true });
      }}
    >
      <AdminScreen route={currentRoute} searchQuery={searchQuery} onNavigate={navigate} />
    </AdminLayout>
  );
}

export function AdminLogin() {
  const navigateRouter = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      await loginAdmin({ email, senha: password });
      navigateRouter("/admin/dashboard", { replace: true });
    } catch {
      setError("E-mail ou senha invalidos. Verifique os dados e tente novamente.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="admin-login">
      <section className="admin-login__brand">
        <a className="admin-login__back" href="/">
          Voltar ao site público
        </a>
        <div className="admin-login__logo" aria-label={brand.name}>
          <img
            src="/images/logo/logo-pe-na-areia-favicon-blue.png"
            alt=""
            aria-hidden="true"
          />
          <span>{brand.nameUpper}</span>
        </div>
        <span className="admin-login__eyebrow">{brand.adminName}</span>
        <h1>Gestão da arena em tempo real.</h1>
        <p>
          Acompanhe reservas, quadras, clientes e comunicados em uma área
          administrativa protegida.
        </p>
        <div className="admin-login__security">
          <ShieldCheck aria-hidden="true" />
          <span>Acesso seguro para a equipe do complexo.</span>
        </div>
      </section>

      <form className="admin-login__card" aria-label="Login administrativo" onSubmit={handleSubmit}>
        <span className="admin-login__card-kicker">Acesso do gestor</span>
        <h2>Entrar no painel</h2>
        <label>
          E-mail
          <div>
            <Mail aria-hidden="true" size={18} />
            <input
              type="email"
              name="email"
              placeholder="admin@teste.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              autoComplete="email"
              required
            />
          </div>
        </label>
        <label>
          Senha
          <div className="admin-login__password-field">
            <LockKeyhole aria-hidden="true" size={18} />
            <input
              type={showPassword ? "text" : "password"}
              name="senha"
              placeholder="********"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="current-password"
              required
            />
            <button
              aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
              className="admin-login__password-toggle"
              type="button"
              onClick={() => setShowPassword((current) => !current)}
            >
              {showPassword ? (
                <EyeOff aria-hidden="true" size={18} />
              ) : (
                <Eye aria-hidden="true" size={18} />
              )}
            </button>
          </div>
        </label>
        {error && (
          <p className="admin-login__error" role="alert">
            {error}
          </p>
        )}
        <button
          className="admin-button admin-button--primary admin-login__submit"
          type="submit"
          disabled={isSubmitting}
        >
          <span>{isSubmitting ? "Entrando..." : "Entrar"}</span>
          <ChevronRight aria-hidden="true" size={18} />
        </button>
        <p className="admin-login__help">
          Esqueceu a senha? Fale com o administrador.
        </p>
      </form>
    </main>
  );
}

function AdminLayout({
  children,
  currentRoute,
  onCloseSidebar,
  onLogout,
  onNavigate,
  onSearchChange,
  onToggleSidebar,
  searchQuery,
  sidebarCollapsed,
  sidebarOpen,
}) {
  const currentPage = pageTitles[currentRoute] || pageTitles.dashboard;
  const searchEnabled = ["reservas", "quadras", "modalidades", "clientes", "comunicados"].includes(currentRoute);
  const [isDarkMode, setIsDarkMode] = useState(() => localStorage.getItem("admin-theme") === "dark");
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [notificationsLoading, setNotificationsLoading] = useState(false);
  const formattedToday = useMemo(
    () =>
      new Intl.DateTimeFormat("pt-BR", {
        day: "2-digit",
        month: "short",
        weekday: "short",
      })
        .format(new Date())
        .replace(/\.$/, ""),
    [],
  );

  useEffect(() => {
    localStorage.setItem("admin-theme", isDarkMode ? "dark" : "light");
  }, [isDarkMode]);

  useEffect(() => {
    let active = true;

    async function carregarNotificacoes() {
      setNotificationsLoading(true);
      const [reservasResult, quadrasResult] = await Promise.allSettled([
        listarReservas(),
        listarQuadrasAdmin(),
      ]);

      if (!active) return;

      const reservas = reservasResult.status === "fulfilled" ? reservasResult.value : [];
      const quadras = quadrasResult.status === "fulfilled" ? quadrasResult.value : [];
      setNotifications(montarNotificacoesAdmin(reservas, quadras));
      setNotificationsLoading(false);
    }

    void carregarNotificacoes();

    return () => {
      active = false;
    };
  }, [currentRoute]);

  return (
    <div className={`admin-shell ${isDarkMode ? "admin-shell--dark" : ""} ${sidebarCollapsed ? "admin-shell--sidebar-collapsed" : ""}`}>
      <aside className={`admin-sidebar ${sidebarOpen ? "admin-sidebar--open" : ""}`}>
        <div className="admin-sidebar__top">
          <a className="admin-logo" href="/">
            <img
              src="/images/logo/logo-pe-na-areia-favicon-blue.png"
              alt=""
              aria-hidden="true"
            />
            <span>{brand.nameUpper}</span>
          </a>
          <button className="admin-sidebar__close" type="button" onClick={onCloseSidebar}>
            <X aria-hidden="true" />
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
              <Icon aria-hidden="true" size={18} />
              {label}
            </button>
          ))}
        </nav>

        <div className="admin-sidebar__footer">
          <div>
            <span>Sistema conectado</span>
            <strong>Painel administrativo</strong>
          </div>
          <button type="button" onClick={onLogout}>
            <LogOut aria-hidden="true" size={18} />
            Sair
          </button>
        </div>
      </aside>

      {sidebarOpen && <button className="admin-overlay" type="button" onClick={onCloseSidebar} />}

      <div className="admin-main">
        <header className="admin-header">
          <button
            className="admin-header__menu"
            type="button"
            aria-label={sidebarCollapsed ? "Abrir menu lateral" : "Fechar menu lateral"}
            title={sidebarCollapsed ? "Abrir menu lateral" : "Fechar menu lateral"}
            onClick={onToggleSidebar}
          >
            <Menu aria-hidden="true" />
          </button>
          <div className="admin-header__copy">
            <div className="admin-header__kicker">
              <span>{currentPage.eyebrow}</span>
              <span>{formattedToday}</span>
            </div>
            <h1>{currentPage.title}</h1>
            <p>{currentPage.description}</p>
          </div>
          <div className="admin-header__actions" aria-label="Acoes do painel">
            {searchEnabled && (
              <SearchInput
                placeholder="Buscar no painel"
                value={searchQuery}
                onChange={onSearchChange}
              />
            )}
            <div className="admin-notifications">
              <button
                type="button"
                aria-expanded={notificationsOpen}
                aria-label="Notificacoes"
                title="Notificacoes"
                className={notificationsOpen ? "is-active" : ""}
                onClick={() => setNotificationsOpen((current) => !current)}
              >
                <Bell aria-hidden="true" size={19} />
                {notifications.length > 0 && <i />}
              </button>
              {notificationsOpen && (
                <div className="admin-notifications__panel" role="status">
                  <strong>Notificacoes</strong>
                  {notificationsLoading ? (
                    <p>Carregando avisos...</p>
                  ) : notifications.length ? (
                    notifications.map((notification) => (
                      <button
                        key={notification.id}
                        type="button"
                        onClick={() => {
                          setNotificationsOpen(false);
                          onNavigate(notification.route);
                        }}
                      >
                        <span>{notification.title}</span>
                        <small>{notification.description}</small>
                      </button>
                    ))
                  ) : (
                    <p>Nenhuma pendencia no momento.</p>
                  )}
                </div>
              )}
            </div>
            <button
              type="button"
              aria-label={isDarkMode ? "Usar modo claro" : "Usar modo escuro"}
              aria-pressed={isDarkMode}
              title={isDarkMode ? "Usar modo claro" : "Usar modo escuro"}
              className={isDarkMode ? "is-active" : ""}
              onClick={() => setIsDarkMode((current) => !current)}
            >
              {isDarkMode ? (
                <Sun aria-hidden="true" size={19} />
              ) : (
                <Moon aria-hidden="true" size={19} />
              )}
            </button>
            <div className="admin-user">
              <span>PO</span>
              <div>
                <strong>Pablo</strong>
                <small>Operador</small>
              </div>
            </div>
          </div>
        </header>
        {children}
      </div>
    </div>
  );
}

function AdminScreen({ route, searchQuery, onNavigate }) {
  const screens = {
    dashboard: <DashboardScreen onNavigate={onNavigate} />,
    reservas: <ReservationsScreen searchQuery={searchQuery} />,
    quadras: <CourtsScreen searchQuery={searchQuery} />,
    modalidades: <ModalitiesScreen searchQuery={searchQuery} />,
    horarios: <ScheduleScreen />,
    clientes: <ClientsScreen searchQuery={searchQuery} />,
    comunicados: <AnnouncementsScreen searchQuery={searchQuery} />,
    relatorios: <ReportsScreen />,
  };

  return screens[route] || screens.dashboard;
}

function DashboardScreen({ onNavigate }) {
  const [dashboard, setDashboard] = useState(null);
  const [reservas, setReservas] = useState([]);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let active = true;

    async function carregarDashboard() {
      try {
        const [dashboardData, reservasData] = await Promise.all([
          buscarDashboard(),
          listarReservas(),
        ]);
        if (!active) return;
        setDashboard(dashboardData);
        setReservas(reservasData);
      } catch {
        if (active) setError("Não foi possível carregar os dados do dashboard.");
      } finally {
        if (active) setIsLoading(false);
      }
    }

    carregarDashboard();

    return () => {
      active = false;
    };
  }, []);

  const stats = dashboard
    ? [
        {
          id: "reservas-dia",
          label: "Reservas hoje",
          value: dashboard.reservasHoje,
          trend: "dados atualizados",
          tone: "green",
        },
        {
          id: "reservas-semana",
          label: "Reservas na semana",
          value: dashboard.reservasSemana,
          trend: "semana atual",
          tone: "blue",
        },
        {
          id: "clientes",
          label: "Clientes",
          value: dashboard.clientesCadastrados,
          trend: "base total",
          tone: "sand",
        },
        {
          id: "quadras",
          label: "Quadras ativas",
          value: dashboard.quadrasAtivas,
          trend: "ativas",
          tone: "orange",
        },
        {
          id: "horario-top",
          label: "Horario mais procurado",
          value: dashboard.horariosMaisProcurados?.[0]?.horaInicio?.slice(0, 5) || "--",
          trend: "maior volume",
          tone: "dark",
        },
        {
          id: "ocupacao",
          label: "Confirmadas",
          value: dashboard.reservasConfirmadas,
          trend: `${dashboard.reservasCanceladas || 0} canceladas`,
          tone: "green",
        },
      ]
    : [];

  const nextReservations = reservas.slice(0, 3).map((reserva) => ({
    id: reserva.id,
    customer: reserva.cliente?.nome || "--",
    court: reserva.quadra?.nome || "--",
    modality: reserva.modalidade?.nome || "--",
    date: reserva.data,
    time: String(reserva.horaInicio || "").slice(0, 5),
    status: statusReserva(reserva.status),
  }));
  const pendingReservations = reservas.filter((item) => item.status === "aguardando_pagamento");
  const pendingCountLabel = pendingReservations.length
    ? `${pendingReservations.length} pagamento${pendingReservations.length === 1 ? "" : "s"} aguardando Mercado Pago`
    : "Nenhuma pendência no Mercado Pago";
  const pendingDescription = pendingReservations.length
    ? "A confirmação depende do retorno do Mercado Pago. Abra reservas para conferir o status."
    : "Quando um pagamento ficar pendente, ele aparece aqui para acompanhamento.";
  const pendingBadgeLabel = `${pendingReservations.length} pendente${pendingReservations.length === 1 ? "" : "s"}`;

  return (
    <div className="admin-page">
      <AdminState
        error={error}
        isLoading={isLoading}
        loadingText="Carregando dashboard..."
      />
      <DashboardCards stats={stats} />

      <section className="admin-grid admin-grid--dashboard">
        <Panel title="Próximas reservas" action="Ver agenda" onAction={() => onNavigate?.("horarios")}>
          <div className="admin-reservation-list">
            {nextReservations.map((reservation) => (
              <ReservationSummary key={reservation.id} reservation={reservation} />
            ))}
          </div>
        </Panel>

        <Panel title="Mercado Pago" action={pendingBadgeLabel}>
          <div className="admin-pending-card">
            <span className="admin-pending-card__icon">
              <AlertTriangle aria-hidden="true" size={22} />
            </span>
            <strong>{pendingCountLabel}</strong>
            <p>{pendingDescription}</p>
            <AdminButton onClick={() => onNavigate?.("reservas")}>
              {pendingReservations.length ? "Revisar pendências" : "Abrir reservas"}
            </AdminButton>
          </div>
        </Panel>
      </section>

      <section className="admin-grid admin-grid--two">
        <Panel title="Atalhos rápidos">
          <QuickActions onNavigate={onNavigate} />
        </Panel>
        <Panel title="Avisos importantes">
          <div className="admin-alerts">
            <p>
              <strong>Quadra 03 em manutenção:</strong> bloquear manhã até troca
              de rede ser concluída.
            </p>
            <p>
              <strong>Alta procura às 19h:</strong> considere liberar pacote de
              horários noturnos.
            </p>
            <p>
              <strong>Arquivos:</strong> revisar fotos da quadra central antes
              da próxima campanha.
            </p>
          </div>
        </Panel>
      </section>
    </div>
  );
}

function DashboardCards({ stats = [] }) {
  return (
    <section className="admin-stats">
      {stats.map((stat) => (
        <article className={`admin-stat admin-stat--${stat.tone}`} key={stat.id}>
          <span>{stat.label}</span>
          <strong>{stat.value}</strong>
          <small>{stat.trend}</small>
        </article>
      ))}
    </section>
  );
}

function QuickActions({ onNavigate }) {
  const actions = [
    {
      label: "Reservas",
      description: "Agenda",
      route: "reservas",
      icon: CalendarCheck,
    },
    {
      label: "Quadras",
      description: "Estrutura",
      route: "quadras",
      icon: LayoutGrid,
    },
    {
      label: "Horários",
      description: "Bloqueios",
      route: "horarios",
      icon: Clock3,
    },
    {
      label: "Avisos",
      description: "Comunicados",
      route: "comunicados",
      icon: Megaphone,
    },
    {
      label: "Relatórios",
      description: "Indicadores",
      route: "relatorios",
      icon: BarChart3,
    },
  ];

  return (
    <div className="admin-quick-actions">
      {actions.map(({ description, icon: Icon, label, route }) => (
        <button key={route} type="button" onClick={() => onNavigate?.(route)}>
          <Icon aria-hidden="true" size={18} />
          <span>{label}</span>
          <small>{description}</small>
          <ChevronRight aria-hidden="true" size={16} />
        </button>
      ))}
    </div>
  );
}

function ReservationsScreen({ searchQuery = "" }) {
  const [reservas, setReservas] = useState([]);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [feedback, setFeedback] = useState("");
  const [savingAction, setSavingAction] = useState("");

  const carregarReservas = async () => {
    setIsLoading(true);
    setError("");
    try {
      setReservas(await listarReservas());
    } catch {
      setError("Não foi possível carregar as reservas.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void Promise.resolve().then(carregarReservas);
  }, []);

  const executarAcao = async ({ acao, id, key, successMessage }) => {
    setFeedback("");
    setError("");
    setSavingAction(key);
    try {
      await acao(id);
      setFeedback(successMessage || "Alteracao salva com sucesso.");
      await carregarReservas();
    } catch (requestError) {
      setError(requestError.message || "Não foi possível atualizar a reserva.");
    } finally {
      setSavingAction("");
    }
  };

  const reservasFiltradas = useMemo(() => {
    const termo = normalizarBusca(searchQuery);
    if (!termo) return reservas;

    return reservas.filter((reservation) => {
      const valores = [
        reservation.cliente?.nome,
        reservation.cliente?.telefone,
        reservation.cliente?.email,
        reservation.quadra?.nome,
        reservation.modalidade?.nome,
        reservation.data,
        formatarDataAdmin(reservation.data),
        formatarDataReservaAdmin(reservation.data).full,
        String(reservation.horaInicio || "").slice(0, 5),
        statusReserva(reservation.status),
        statusPagamento(reservation.pagamentoStatus),
      ];
      return valores.some((valor) => normalizarBusca(valor).includes(termo));
    });
  }, [reservas, searchQuery]);

  return (
    <div className="admin-page admin-page--reservations">
      <Panel className="admin-panel--reservations" title="Reservas">
        <AdminState
          error={error}
          isLoading={isLoading}
          empty={!reservasFiltradas.length}
          loadingText="Carregando reservas..."
          emptyText={searchQuery ? "Nenhuma reserva encontrada para essa busca." : "Nenhuma reserva encontrada."}
        />
        {feedback && <p className="admin-success">{feedback}</p>}
        {!isLoading && !error && reservasFiltradas.length > 0 && (
          <ResponsiveTable
            className="admin-reservations-table"
            columns={["Cliente", "Quadra", "Modalidade", "Data", "Horário", "Status", "Pagamento", "Ações"]}
          >
            {reservasFiltradas.map((reservation) => (
              <tr key={reservation.id}>
                <td>
                  <strong>{reservation.cliente?.nome || "--"}</strong>
                  <small>{reservation.cliente?.telefone || "--"}</small>
                </td>
                <td>{reservation.quadra?.nome || "--"}</td>
                <td>{reservation.modalidade?.nome || "--"}</td>
                <td>
                  <ReservationDate value={reservation.data} />
                </td>
                <td>
                  <span className="admin-time-chip">{formatarHoraAdmin(reservation.horaInicio)}</span>
                </td>
                <td>
                  <StatusBadge status={statusReserva(reservation.status)} />
                </td>
                <td>
                  <StatusBadge status={statusPagamento(reservation.pagamentoStatus)} />
                </td>
                <td>
                  <ReservationActions
                    reservation={reservation}
                    savingAction={savingAction}
                    onAction={executarAcao}
                  />
                </td>
              </tr>
            ))}
          </ResponsiveTable>
        )}
      </Panel>
    </div>
  );
}

function ReservationDate({ value }) {
  const data = formatarDataReservaAdmin(value);

  return (
    <time className="admin-date-cell" dateTime={String(value || "")} title={data.full}>
      <span>{data.weekday}</span>
      <strong>{data.day}</strong>
      <small>{data.month} {data.year}</small>
    </time>
  );
}

function ReservationActions({ onAction, reservation, savingAction }) {
  const actions = [
    {
      acao: confirmarReserva,
      enabled: reservation.status === "aguardando_pagamento" && reservation.pagamentoStatus === "aprovado",
      icon: Check,
      id: "confirmar",
      label: "Confirmar",
      successMessage: "Reserva confirmada com sucesso.",
    },
    {
      acao: cancelarReserva,
      enabled: ["aguardando_pagamento", "confirmada"].includes(reservation.status),
      icon: X,
      id: "cancelar",
      label: "Cancelar",
      successMessage: "Reserva cancelada com sucesso.",
    },
    {
      acao: finalizarReserva,
      enabled: reservation.status === "confirmada",
      icon: Eye,
      id: "finalizar",
      label: "Finalizar",
      successMessage: "Reserva finalizada com sucesso.",
    },
  ].filter((action) => action.enabled);

  if (!actions.length) {
    return <span className="admin-row-note" title="Sem ação disponível">Sem ação</span>;
  }

  return (
    <div className="admin-table-actions admin-table-actions--reservations">
      {actions.map(({ acao, icon: Icon, id, label, successMessage }) => {
        const key = `${reservation.id}-${id}`;
        const isSaving = savingAction === key;

        return (
          <button
            aria-label={`${label} reserva ${reservation.id}`}
            className={`admin-table-action admin-table-action--${id}`}
            disabled={Boolean(savingAction)}
            key={id}
            title={`${label} reserva`}
            type="button"
            onClick={() => onAction({ acao, id: reservation.id, key, successMessage })}
          >
            <Icon aria-hidden="true" size={15} />
            <span>{isSaving ? "Salvando..." : label}</span>
          </button>
        );
      })}
    </div>
  );
}

function CourtsScreen({ searchQuery = "" }) {
  const [courts, setCourts] = useState([]);
  const [modalidades, setModalidades] = useState([]);
  const [priceDrafts, setPriceDrafts] = useState({});
  const [savingPriceId, setSavingPriceId] = useState(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState("");
  const [courtForm, setCourtForm] = useState(cadastroQuadraInicial);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [feedback, setFeedback] = useState("");

  const carregarQuadras = async () => {
    setIsLoading(true);
    setError("");
    try {
      const [quadrasResult, modalidadesResult] = await Promise.allSettled([
        listarQuadrasAdmin(),
        listarModalidades(),
      ]);
      if (quadrasResult.status === "rejected") throw quadrasResult.reason;
      const quadras = quadrasResult.value;
      const modalidadesCarregadas = modalidadesResult.status === "fulfilled" ? modalidadesResult.value : [];
      setCourts(quadras);
      setModalidades(modalidadesCarregadas);
      setPriceDrafts(
        Object.fromEntries(quadras.map((quadra) => [quadra.id, formatarValorQuadra(quadra.valorHora)])),
      );
    } catch {
      setError("Não foi possível carregar as quadras.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void Promise.resolve().then(carregarQuadras);
  }, []);

  const mudarStatus = async (id, status) => {
    setFeedback("");
    setError("");
    try {
      await alterarStatusQuadra(id, status);
      setCourts((atuais) => atuais.map((court) => (court.id === id ? { ...court, status } : court)));
      setFeedback("Status da quadra atualizado.");
    } catch (requestError) {
      setError(requestError.message || "Não foi possível atualizar a quadra.");
    }
  };

  const atualizarRascunhoValor = (id, valor) => {
    setPriceDrafts((atual) => ({ ...atual, [id]: valor }));
  };

  const salvarValor = async (event, court) => {
    event.preventDefault();
    setFeedback("");
    setError("");

    const valorHora = normalizarValorQuadra(priceDrafts[court.id]);
    if (valorHora === null) {
      setError("Informe um valor válido para a quadra.");
      return;
    }

    if (!court.modalidades?.length) {
      setError("A quadra precisa ter modalidades vinculadas para atualizar o valor.");
      return;
    }

    setSavingPriceId(court.id);
    try {
      await atualizarQuadra(court.id, dadosQuadraParaAtualizacao(court, valorHora));
      setFeedback(`Valor da ${court.nome} atualizado.`);
      await carregarQuadras();
    } catch (requestError) {
      setError(requestError.message || "Não foi possível atualizar o valor da quadra.");
    } finally {
      setSavingPriceId(null);
    }
  };

  const abrirCadastroQuadra = () => {
    setCreateError("");
    setCourtForm({
      ...cadastroQuadraInicial,
      modalidadesIds: modalidades.map((modalidade) => modalidade.id),
    });
    setIsCreateOpen(true);
  };

  const fecharCadastroQuadra = () => {
    if (isCreating) return;
    setIsCreateOpen(false);
    setCreateError("");
  };

  const atualizarCampoCadastro = (campo, valor) => {
    setCourtForm((atual) => ({ ...atual, [campo]: valor }));
  };

  const alternarModalidadeCadastro = (id) => {
    setCourtForm((atual) => {
      const selecionadas = atual.modalidadesIds.includes(id)
        ? atual.modalidadesIds.filter((modalidadeId) => modalidadeId !== id)
        : [...atual.modalidadesIds, id];
      return { ...atual, modalidadesIds: selecionadas };
    });
  };

  const salvarCadastroQuadra = async (event) => {
    event.preventDefault();
    setCreateError("");
    setFeedback("");
    setError("");

    const valorHora = normalizarValorQuadra(courtForm.valorHora);
    if (!courtForm.nome.trim()) {
      setCreateError("Informe o nome da quadra.");
      return;
    }
    if (valorHora === null) {
      setCreateError("Informe um valor valido para a quadra.");
      return;
    }
    if (!courtForm.modalidadesIds.length) {
      setCreateError("Selecione ao menos uma modalidade.");
      return;
    }

    setIsCreating(true);
    try {
      await criarQuadra({
        nome: courtForm.nome.trim(),
        descricao: courtForm.descricao.trim(),
        valorHora,
        imagemUrl: courtForm.imagemUrl.trim(),
        modalidadesIds: courtForm.modalidadesIds,
      });
      setFeedback("Quadra criada com sucesso.");
      setIsCreateOpen(false);
      setCourtForm(cadastroQuadraInicial);
      await carregarQuadras();
    } catch (requestError) {
      setCreateError(requestError.message || "Nao foi possivel cadastrar a quadra.");
    } finally {
      setIsCreating(false);
    }
  };

  const courtsFiltradas = useMemo(() => {
    const termo = normalizarBusca(searchQuery);
    if (!termo) return courts;

    return courts.filter((court) => {
      const valores = [
        court.nome,
        court.descricao,
        statusQuadra(court.status),
        formatarValorQuadra(court.valorHora),
        ...(court.modalidades || []).map((modalidade) => modalidade.nome),
      ];
      return valores.some((valor) => normalizarBusca(valor).includes(termo));
    });
  }, [courts, searchQuery]);

  return (
    <div className="admin-page">
      <Toolbar title="Quadras" buttonLabel="Cadastrar nova quadra" onButtonClick={abrirCadastroQuadra} />
      <AdminState
        error={error}
        isLoading={isLoading}
        empty={!courtsFiltradas.length}
        loadingText="Carregando quadras..."
        emptyText={searchQuery ? "Nenhuma quadra encontrada para essa busca." : "Nenhuma quadra encontrada."}
      />
      {feedback && <p className="admin-success">{feedback}</p>}
      {!isLoading && !error && courtsFiltradas.length > 0 && (
        <section className="admin-court-grid">
          {courtsFiltradas.map((court, index) => (
            <article className="admin-court-card" key={court.id}>
              <img src={getCourtImage(court, index)} alt={`Foto da ${court.nome}`} />
              <div>
                <span>C-{String(court.id).padStart(2, "0")}</span>
                <StatusBadge status={statusQuadra(court.status)} />
              </div>
              <h2>{court.nome}</h2>
              <p>{(court.modalidades || []).map((modalidade) => modalidade.nome).join(" | ") || court.descricao || "--"}</p>
              <footer>
                <small>{court.descricao || "Sem descricao"}</small>
              </footer>
              {court.status === "manutencao" && (
                <div className="admin-court-card__notice">
                  <AlertTriangle aria-hidden="true" size={17} />
                  <span>
                    <strong>Em manutenção</strong>
                    <small>Oculta para clientes até ser ativada novamente.</small>
                  </span>
                </div>
              )}
              <form className="admin-court-card__price-form" onSubmit={(event) => salvarValor(event, court)}>
                <label htmlFor={`court-price-${court.id}`}>Valor por hora</label>
                <div className="admin-court-card__price-field">
                  <span>R$</span>
                  <input
                    id={`court-price-${court.id}`}
                    inputMode="decimal"
                    value={priceDrafts[court.id] ?? formatarValorQuadra(court.valorHora)}
                    onChange={(event) => atualizarRascunhoValor(court.id, event.target.value)}
                  />
                </div>
                <AdminButton type="submit" variant="ghost" disabled={savingPriceId === court.id}>
                  {savingPriceId === court.id ? "Salvando..." : "Salvar valor"}
                </AdminButton>
              </form>
              <div className="admin-card-actions">
                <AdminButton variant="ghost" disabled={court.status === "ativa"} onClick={() => mudarStatus(court.id, "ativa")}>
                  Ativar
                </AdminButton>
                <AdminButton
                  variant="ghost"
                  disabled={court.status === "manutencao"}
                  onClick={() => mudarStatus(court.id, "manutencao")}
                >
                  Manutenção
                </AdminButton>
                <AdminButton disabled={court.status === "inativa"} onClick={() => mudarStatus(court.id, "inativa")}>
                  Inativar
                </AdminButton>
              </div>
            </article>
          ))}
        </section>
      )}
      {isCreateOpen && (
        <div className="admin-modal-backdrop" role="presentation" onMouseDown={fecharCadastroQuadra}>
          <section
            className="admin-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="admin-create-court-title"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <header>
              <div>
                <span>Nova quadra</span>
                <h2 id="admin-create-court-title">Cadastrar quadra</h2>
              </div>
              <button type="button" aria-label="Fechar cadastro" onClick={fecharCadastroQuadra}>
                <X aria-hidden="true" size={20} />
              </button>
            </header>
            <form className="admin-form admin-form--court-create" onSubmit={salvarCadastroQuadra}>
              <label>
                Nome
                <input
                  value={courtForm.nome}
                  onChange={(event) => atualizarCampoCadastro("nome", event.target.value)}
                  placeholder="Areia 04"
                  required
                />
              </label>
              <label>
                Valor por hora
                <input
                  inputMode="decimal"
                  value={courtForm.valorHora}
                  onChange={(event) => atualizarCampoCadastro("valorHora", event.target.value)}
                  placeholder="90,00"
                  required
                />
              </label>
              <label className="admin-form__wide">
                URL da imagem
                <input
                  value={courtForm.imagemUrl}
                  onChange={(event) => atualizarCampoCadastro("imagemUrl", event.target.value)}
                  placeholder="/images/quadras/areia-01.jpeg"
                />
              </label>
              <label className="admin-form__wide">
                Descricao
                <textarea
                  value={courtForm.descricao}
                  onChange={(event) => atualizarCampoCadastro("descricao", event.target.value)}
                  placeholder="Quadra coberta com areia nivelada e iluminacao profissional."
                />
              </label>
              <fieldset className="admin-form__wide admin-fieldset">
                <legend>Modalidades</legend>
                <div>
                  {modalidades.map((modalidade) => (
                    <label className="admin-check" key={modalidade.id}>
                      <input
                        type="checkbox"
                        checked={courtForm.modalidadesIds.includes(modalidade.id)}
                        onChange={() => alternarModalidadeCadastro(modalidade.id)}
                      />
                      {modalidade.nome}
                    </label>
                  ))}
                </div>
              </fieldset>
              {createError && <p className="admin-error admin-form__wide">{createError}</p>}
              <div className="admin-modal__actions admin-form__wide">
                <AdminButton type="button" variant="ghost" onClick={fecharCadastroQuadra} disabled={isCreating}>
                  Cancelar
                </AdminButton>
                <AdminButton type="submit" disabled={isCreating}>
                  {isCreating ? "Cadastrando..." : "Cadastrar quadra"}
                </AdminButton>
              </div>
            </form>
          </section>
        </div>
      )}
    </div>
  );
}

function ModalitiesScreen({ searchQuery = "" }) {
  const [modalidades, setModalidades] = useState([]);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [feedback, setFeedback] = useState("");

  const carregarModalidades = async () => {
    setIsLoading(true);
    setError("");
    try {
      setModalidades(await listarModalidades());
    } catch {
      setError("Não foi possível carregar as modalidades.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void Promise.resolve().then(carregarModalidades);
  }, []);

  const mudarStatus = async (id, status) => {
    setFeedback("");
    setError("");
    try {
      await alterarStatusModalidade(id, status);
      setFeedback("Status da modalidade atualizado.");
      await carregarModalidades();
    } catch (requestError) {
      setError(requestError.message || "Não foi possível atualizar a modalidade.");
    }
  };

  const modalidadesFiltradas = useMemo(() => {
    const termo = normalizarBusca(searchQuery);
    if (!termo) return modalidades;

    return modalidades.filter((modalidade) => {
      const valores = [
        modalidade.nome,
        modalidade.descricao,
        modalidade.status === "ativa" ? "Ativa" : "Inativa",
      ];
      return valores.some((valor) => normalizarBusca(valor).includes(termo));
    });
  }, [modalidades, searchQuery]);

  return (
    <div className="admin-page">
      <Panel title="Modalidades">
        <AdminState
          error={error}
          isLoading={isLoading}
          empty={!modalidadesFiltradas.length}
          loadingText="Carregando modalidades..."
          emptyText={searchQuery ? "Nenhuma modalidade encontrada para essa busca." : "Nenhuma modalidade encontrada."}
        />
        {feedback && <p className="admin-success">{feedback}</p>}
        {!isLoading && !error && modalidadesFiltradas.length > 0 && (
          <ResponsiveTable columns={["Nome", "Descricao", "Status", "Acoes"]}>
            {modalidadesFiltradas.map((modalidade) => (
              <tr key={modalidade.id}>
                <td>
                  <strong>{modalidade.nome}</strong>
                  <small>MOD-{modalidade.id}</small>
                </td>
                <td>{modalidade.descricao || "--"}</td>
                <td>
                  <StatusBadge status={modalidade.status === "ativa" ? "Ativa" : "Inativa"} />
                </td>
                <td>
                  <div className="admin-table-actions">
                    <button type="button" onClick={() => mudarStatus(modalidade.id, "ativa")}>
                      <Check aria-hidden="true" size={15} />
                      <span>Ativar</span>
                    </button>
                    <button type="button" onClick={() => mudarStatus(modalidade.id, "inativa")}>
                      <X aria-hidden="true" size={15} />
                      <span>Inativar</span>
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </ResponsiveTable>
        )}
      </Panel>
    </div>
  );
}

function ScheduleScreen() {
  const [horarios, setHorarios] = useState([]);
  const [quadras, setQuadras] = useState([]);
  const [modalidades, setModalidades] = useState([]);
  const [filtros, setFiltros] = useState({
    quadraId: "",
    modalidadeId: "",
    data: "",
    status: "",
  });
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [feedback, setFeedback] = useState("");
  const [savingSlotId, setSavingSlotId] = useState(null);
  const agendaDateInitializedRef = useRef(false);

  const carregarHorarios = useCallback(async () => {
    setIsLoading(true);
    setError("");
    try {
      const [horariosCarregados, quadrasCarregadas, modalidadesCarregadas] = await Promise.all([
        listarHorarios(),
        listarQuadrasAdmin(),
        listarModalidades(),
      ]);
      setHorarios(horariosCarregados);
      setQuadras(quadrasCarregadas);
      setModalidades(modalidadesCarregadas);
      if (!agendaDateInitializedRef.current) {
        const datasCarregadas = [
          ...new Set(
            horariosCarregados
              .map((horario) => String(horario.data || "").slice(0, 10))
              .filter(Boolean),
          ),
        ].sort();
        const dataInicial = encontrarDataPadraoAgenda(datasCarregadas);
        if (dataInicial) {
          setFiltros((current) => (current.data ? current : { ...current, data: dataInicial }));
          agendaDateInitializedRef.current = true;
        }
      }
    } catch {
      setError("Não foi possível carregar os horários.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void Promise.resolve().then(carregarHorarios);
  }, [carregarHorarios]);

  const executarAcao = async (acao, id) => {
    setFeedback("");
    setError("");
    setSavingSlotId(id);
    try {
      await acao(id);
      setFeedback("Horário atualizado com sucesso.");
      await carregarHorarios();
    } catch (requestError) {
      setError(requestError.message || "Não foi possível atualizar o horário.");
    } finally {
      setSavingSlotId(null);
    }
  };

  const quadrasPorId = useMemo(
    () => new Map(quadras.map((quadra) => [String(quadra.id), quadra])),
    [quadras],
  );

  const quadraAceitaModalidade = useCallback(
    (quadra, modalidadeId) => {
      if (!modalidadeId) return true;
      return (quadra?.modalidades || []).some((modalidade) => String(modalidade.id) === modalidadeId);
    },
    [],
  );

  const quadrasFiltradasPorModalidade = useMemo(
    () => quadras.filter((quadra) => quadraAceitaModalidade(quadra, filtros.modalidadeId)),
    [filtros.modalidadeId, quadraAceitaModalidade, quadras],
  );

  const modalidadeSelecionada = useMemo(
    () => modalidades.find((modalidade) => String(modalidade.id) === filtros.modalidadeId),
    [filtros.modalidadeId, modalidades],
  );

  const quadraSelecionada = useMemo(
    () => quadras.find((quadra) => String(quadra.id) === filtros.quadraId),
    [filtros.quadraId, quadras],
  );

  const datasDisponiveis = useMemo(
    () => [...new Set(horarios.map((horario) => String(horario.data || "").slice(0, 10)).filter(Boolean))].sort(),
    [horarios],
  );

  const dataPadraoAgenda = useMemo(
    () => encontrarDataPadraoAgenda(datasDisponiveis),
    [datasDisponiveis],
  );

  const horariosFiltrados = useMemo(() => {
    const compararHorario = (a, b) =>
      `${a.data || ""}${a.quadra?.nome || ""}${a.horaInicio || ""}`.localeCompare(
        `${b.data || ""}${b.quadra?.nome || ""}${b.horaInicio || ""}`,
      );

    return horarios
      .filter((horario) => {
        const quadraId = String(horario.quadraId || horario.quadra?.id || "");
        const quadra = quadrasPorId.get(quadraId) || horario.quadra;
        const data = String(horario.data || "").slice(0, 10);

        if (filtros.quadraId && quadraId !== filtros.quadraId) return false;
        if (filtros.data && data !== filtros.data) return false;
        if (filtros.status && horario.status !== filtros.status) return false;
        if (filtros.modalidadeId) {
          const modalidadesDaQuadra = quadra?.modalidades || [];
          return modalidadesDaQuadra.some((modalidade) => String(modalidade.id) === filtros.modalidadeId);
        }
        return true;
      })
      .sort(compararHorario);
  }, [filtros, horarios, quadrasPorId]);

  const resumoHorarios = useMemo(() => {
    const resumo = horariosFiltrados.reduce(
      (acc, horario) => {
        const quadraId = String(horario.quadraId || horario.quadra?.id || "");
        const data = String(horario.data || "").slice(0, 10);

        acc.total += 1;
        acc[horario.status] = (acc[horario.status] || 0) + 1;
        if (quadraId) acc.quadras.add(quadraId);
        if (data) acc.datas.add(data);
        return acc;
      },
      {
        total: 0,
        disponivel: 0,
        reservado: 0,
        bloqueado: 0,
        datas: new Set(),
        quadras: new Set(),
      },
    );
    const total = resumo.total || 1;

    return {
      ...resumo,
      datas: resumo.datas.size,
      quadras: resumo.quadras.size,
      percentualLivre: Math.round((resumo.disponivel / total) * 100),
      percentualReservado: Math.round((resumo.reservado / total) * 100),
      percentualBloqueado: Math.round((resumo.bloqueado / total) * 100),
    };
  }, [horariosFiltrados]);

  const gruposAgenda = useMemo(() => {
    const grupos = new Map();
    horariosFiltrados.forEach((horario) => {
      const quadraId = String(horario.quadraId || horario.quadra?.id || "");
      const quadra = quadrasPorId.get(quadraId) || horario.quadra;
      const data = String(horario.data || "").slice(0, 10);
      const chave = `${quadraId || "sem-quadra"}-${data || "sem-data"}`;

      if (!grupos.has(chave)) {
        grupos.set(chave, {
          key: chave,
          court: quadra?.nome || "Sem quadra",
          data,
          modalidades: modalidadeSelecionada ? [modalidadeSelecionada] : quadra?.modalidades || [],
          slots: [],
        });
      }
      grupos.get(chave).slots.push(horario);
    });

    return [...grupos.values()].map((grupo) => ({
      ...grupo,
      slots: grupo.slots.sort((a, b) => String(a.horaInicio || "").localeCompare(String(b.horaInicio || ""))),
    }));
  }, [horariosFiltrados, modalidadeSelecionada, quadrasPorId]);

  const atualizarFiltro = (campo, valor) => {
    setFiltros((current) => {
      if (campo !== "modalidadeId") return { ...current, [campo]: valor };

      const quadraAtual = quadrasPorId.get(current.quadraId);
      return {
        ...current,
        modalidadeId: valor,
        quadraId: quadraAceitaModalidade(quadraAtual, valor) ? current.quadraId : "",
      };
    });
  };

  const limparFiltros = () => {
    setFiltros({ quadraId: "", modalidadeId: "", data: dataPadraoAgenda, status: "" });
  };

  const dataSelecionada = filtros.data
    ? formatarDataReservaAdmin(filtros.data)
    : null;
  const recorteLabel = dataSelecionada
    ? dataSelecionada.full
    : "Todas as datas";
  const statusLabel = {
    bloqueado: "Bloqueado",
    disponivel: "Livre",
    reservado: "Reservado",
  }[filtros.status];
  const recorteFiltros = [
    quadraSelecionada?.nome,
    modalidadeSelecionada?.nome,
    statusLabel,
  ].filter(Boolean);
  const recorteDetalhe = recorteFiltros.length
    ? recorteFiltros.join(", ")
    : "Todas as quadras e modalidades";

  return (
    <div className="admin-page admin-page--schedule">
      <Panel className="admin-panel--schedule" title="Agenda">
        <AdminState
          error={error}
          isLoading={isLoading}
          empty={!horarios.length}
          loadingText="Carregando horários..."
          emptyText="Nenhum horário encontrado."
        />
        {feedback && <p className="admin-success">{feedback}</p>}
        {!isLoading && !error && horarios.length > 0 && (
          <div className="admin-schedule">
            <div className="admin-schedule__overview">
              <div>
                <span>Recorte atual</span>
                <strong>{recorteLabel}</strong>
              </div>
              <small>
                {resumoHorarios.total} horário{resumoHorarios.total === 1 ? "" : "s"} em {resumoHorarios.quadras} quadra{resumoHorarios.quadras === 1 ? "" : "s"} e {resumoHorarios.datas} data{resumoHorarios.datas === 1 ? "" : "s"}
              </small>
            </div>

            <div className="admin-schedule__filters" aria-label="Filtros da agenda">
              <label>
                Quadra
                <select value={filtros.quadraId} onChange={(event) => atualizarFiltro("quadraId", event.target.value)}>
                  <option value="">Todas as quadras</option>
                  {quadrasFiltradasPorModalidade.map((quadra) => (
                    <option key={quadra.id} value={quadra.id}>
                      {quadra.nome}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Modalidade
                <select
                  value={filtros.modalidadeId}
                  onChange={(event) => atualizarFiltro("modalidadeId", event.target.value)}
                >
                  <option value="">Todas as modalidades</option>
                  {modalidades.map((modalidade) => (
                    <option key={modalidade.id} value={modalidade.id}>
                      {modalidade.nome}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Data
                <select value={filtros.data} onChange={(event) => atualizarFiltro("data", event.target.value)}>
                  <option value="">Todas as datas</option>
                  {datasDisponiveis.map((data) => (
                    <option key={data} value={data}>
                      {formatarDataReservaAdmin(data).full}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Status
                <select value={filtros.status} onChange={(event) => atualizarFiltro("status", event.target.value)}>
                  <option value="">Todos os status</option>
                  <option value="disponivel">Livre</option>
                  <option value="reservado">Reservado</option>
                  <option value="bloqueado">Bloqueado</option>
                </select>
              </label>
              <button className="admin-button admin-button--ghost" type="button" onClick={limparFiltros}>
                Limpar filtros
              </button>
            </div>

            <div className="admin-schedule__summary" aria-label="Resumo dos horários filtrados">
              <article>
                <small>Horários exibidos</small>
                <strong>{resumoHorarios.total}</strong>
                <em>{recorteDetalhe}</em>
              </article>
              <article className="admin-schedule__summary-item--livre">
                <small>Livres</small>
                <strong>{resumoHorarios.disponivel}</strong>
                <em>{resumoHorarios.percentualLivre}% disponível</em>
              </article>
              <article className="admin-schedule__summary-item--reservado">
                <small>Reservados</small>
                <strong>{resumoHorarios.reservado}</strong>
                <em>{resumoHorarios.percentualReservado}% do recorte</em>
              </article>
              <article className="admin-schedule__summary-item--bloqueado">
                <small>Bloqueados</small>
                <strong>{resumoHorarios.bloqueado}</strong>
                <em>{resumoHorarios.percentualBloqueado}% indisponível</em>
              </article>
            </div>

            <div className="admin-schedule__availability" aria-label="Distribuição dos horários">
              <span className="is-free" style={{ width: `${resumoHorarios.percentualLivre}%` }} />
              <span className="is-booked" style={{ width: `${resumoHorarios.percentualReservado}%` }} />
              <span className="is-blocked" style={{ width: `${resumoHorarios.percentualBloqueado}%` }} />
            </div>

            <div className="admin-schedule__legend" aria-label="Legenda de status">
              <button
                type="button"
                aria-pressed={filtros.status === "disponivel"}
                className={filtros.status === "disponivel" ? "is-active" : ""}
                onClick={() => atualizarFiltro("status", filtros.status === "disponivel" ? "" : "disponivel")}
              >
                <i className="is-free" /> Livre
              </button>
              <button
                type="button"
                aria-pressed={filtros.status === "reservado"}
                className={filtros.status === "reservado" ? "is-active" : ""}
                onClick={() => atualizarFiltro("status", filtros.status === "reservado" ? "" : "reservado")}
              >
                <i className="is-booked" /> Reservado
              </button>
              <button
                type="button"
                aria-pressed={filtros.status === "bloqueado"}
                className={filtros.status === "bloqueado" ? "is-active" : ""}
                onClick={() => atualizarFiltro("status", filtros.status === "bloqueado" ? "" : "bloqueado")}
              >
                <i className="is-blocked" /> Bloqueado
              </button>
            </div>

            {horariosFiltrados.length === 0 ? (
              <p className="admin-muted">Nenhum horário encontrado para os filtros selecionados.</p>
            ) : (
              <div className="admin-schedule__board">
                {gruposAgenda.map((grupo) => (
                  <article className="admin-schedule__group" key={grupo.key}>
                    <header>
                      <div>
                        <span>Quadra</span>
                        <strong>{grupo.court}</strong>
                      </div>
                      <div>
                        <span>Data</span>
                        <strong>{formatarDataReservaAdmin(grupo.data).full}</strong>
                      </div>
                      {grupo.modalidades.length > 0 && (
                        <small>{grupo.modalidades.map((modalidade) => modalidade.nome).join(" / ")}</small>
                      )}
                    </header>
                    <div className="admin-schedule__grid">
                      {grupo.slots.map((slot) => {
                        const podeAlternar = slot.status !== "reservado";
                        const isSaving = savingSlotId === slot.id;
                        return (
                          <button
                            className={`admin-slot admin-slot--${statusHorarioClasse(slot.status)}`}
                            disabled={!podeAlternar || isSaving}
                            key={slot.id}
                            title={isSaving ? "Atualizando horário" : podeAlternar ? "Clique para bloquear ou liberar" : "Horário reservado"}
                            type="button"
                            onClick={() =>
                              slot.status === "bloqueado"
                                ? executarAcao(liberarHorario, slot.id)
                                : executarAcao(bloquearHorario, slot.id)
                            }
                          >
                            <span>{formatarHoraAdmin(slot.horaInicio)}</span>
                            <small>{isSaving ? "Atualizando..." : statusHorario(slot.status)}</small>
                          </button>
                        );
                      })}
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>
        )}
      </Panel>
    </div>
  );
}

function ClientsScreen({ searchQuery = "" }) {
  const [clientes, setClientes] = useState([]);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [feedback, setFeedback] = useState("");

  const carregarClientes = async () => {
    setIsLoading(true);
    setError("");
    try {
      setClientes(await listarClientes());
    } catch {
      setError("Não foi possível carregar os clientes.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void Promise.resolve().then(carregarClientes);
  }, []);

  const mudarStatus = async (id, status) => {
    setFeedback("");
    setError("");
    try {
      await alterarStatusCliente(id, status);
      setFeedback("Status do cliente atualizado.");
      await carregarClientes();
    } catch (requestError) {
      setError(requestError.message || "Não foi possível atualizar o cliente.");
    }
  };

  const clientesFiltrados = useMemo(() => {
    const termo = normalizarBusca(searchQuery);
    if (!termo) return clientes;

    return clientes.filter((client) => {
      const valores = [
        client.nome,
        client.telefone,
        client.email,
        client.status === "ativo" ? "Ativo" : "Inativo",
      ];
      return valores.some((valor) => normalizarBusca(valor).includes(termo));
    });
  }, [clientes, searchQuery]);

  return (
    <div className="admin-page">
      <Panel title="Base de clientes">
        <AdminState
          error={error}
          isLoading={isLoading}
          empty={!clientesFiltrados.length}
          loadingText="Carregando clientes..."
          emptyText={searchQuery ? "Nenhum cliente encontrado para essa busca." : "Nenhum cliente encontrado."}
        />
        {feedback && <p className="admin-success">{feedback}</p>}
        {!isLoading && !error && clientesFiltrados.length > 0 && (
          <ResponsiveTable columns={["Nome", "Telefone", "E-mail", "Status", "Acoes"]}>
            {clientesFiltrados.map((client) => (
              <tr key={client.id}>
                <td>
                  <strong>{client.nome}</strong>
                  <small>CL-{client.id}</small>
                </td>
                <td>{client.telefone}</td>
                <td>{client.email}</td>
                <td>
                  <StatusBadge status={client.status === "ativo" ? "Ativo" : "Inativo"} />
                </td>
                <td>
                  <div className="admin-table-actions">
                    <button type="button" onClick={() => mudarStatus(client.id, "ativo")}>
                      <Check aria-hidden="true" size={15} />
                      <span>Ativar</span>
                    </button>
                    <button type="button" onClick={() => mudarStatus(client.id, "inativo")}>
                      <X aria-hidden="true" size={15} />
                      <span>Inativar</span>
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </ResponsiveTable>
        )}
      </Panel>
    </div>
  );
}

function AnnouncementsScreen({ searchQuery = "" }) {
  const [comunicados, setComunicados] = useState([]);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [feedback, setFeedback] = useState("");

  const carregarComunicados = async () => {
    setIsLoading(true);
    setError("");
    try {
      setComunicados(await listarComunicados());
    } catch {
      setError("Não foi possível carregar os comunicados.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void Promise.resolve().then(carregarComunicados);
  }, []);

  const executarAcao = async (acao, id) => {
    setFeedback("");
    setError("");
    try {
      await acao(id);
      setFeedback("Comunicado atualizado com sucesso.");
      await carregarComunicados();
    } catch (requestError) {
      setError(requestError.message || "Não foi possível atualizar o comunicado.");
    }
  };

  const comunicadosFiltrados = useMemo(() => {
    const termo = normalizarBusca(searchQuery);
    if (!termo) return comunicados;

    return comunicados.filter((announcement) => {
      const valores = [
        announcement.titulo,
        announcement.mensagem,
        statusComunicado(announcement.status),
        announcement.destaque ? "Destaque" : "",
      ];
      return valores.some((valor) => normalizarBusca(valor).includes(termo));
    });
  }, [comunicados, searchQuery]);

  return (
    <div className="admin-page admin-page--announcements">
      <Panel className="admin-panel--announcements" title="Comunicados">
        <AdminState
          error={error}
          isLoading={isLoading}
          empty={!comunicadosFiltrados.length}
          loadingText="Carregando comunicados..."
          emptyText={searchQuery ? "Nenhum comunicado encontrado para essa busca." : "Nenhum comunicado encontrado."}
        />
        {feedback && <p className="admin-success">{feedback}</p>}
        {!isLoading && !error && comunicadosFiltrados.length > 0 && (
          <div className="admin-announcements">
            {comunicadosFiltrados.map((announcement) => (
              <article key={announcement.id}>
                <div>
                  <StatusBadge status={statusComunicado(announcement.status)} />
                  {announcement.destaque && <span className="admin-highlight">Destaque</span>}
                </div>
                <h3>{announcement.titulo}</h3>
                <p>{announcement.mensagem}</p>
                <div className="admin-table-actions">
                  <button type="button" onClick={() => executarAcao(publicarComunicado, announcement.id)}>
                    <Check aria-hidden="true" size={15} />
                    <span>Publicar</span>
                  </button>
                  <button type="button" onClick={() => executarAcao(arquivarComunicado, announcement.id)}>
                    <Archive aria-hidden="true" size={15} />
                    <span>Arquivar</span>
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </Panel>
    </div>
  );
}

function ReportsScreen() {
  const [reports, setReports] = useState(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let active = true;

    async function carregarRelatorios() {
      try {
        const [reservas, modalidades, funil] = await Promise.all([
          buscarRelatorioReservas(),
          buscarRelatorioModalidades(),
          buscarRelatorioFunilReserva(),
        ]);
        if (active) setReports({ funil, reservas, modalidades });
      } catch {
        if (active) setError("Não foi possível carregar os relatórios.");
      } finally {
        if (active) setIsLoading(false);
      }
    }

    carregarRelatorios();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    const atualizarRelatorios = async () => {
      try {
        const [reservas, modalidades, funil] = await Promise.all([
          buscarRelatorioReservas(),
          buscarRelatorioModalidades(),
          buscarRelatorioFunilReserva(),
        ]);
        setReports({ funil, reservas, modalidades });
      } catch {
        // Mantem os dados atuais na tela se uma atualizacao silenciosa falhar.
      }
    };

    const atualizarQuandoVisivel = () => {
      if (document.visibilityState === "visible") {
        void atualizarRelatorios();
      }
    };

    const intervalId = window.setInterval(() => {
      void atualizarRelatorios();
    }, 10000);

    window.addEventListener("focus", atualizarQuandoVisivel);
    document.addEventListener("visibilitychange", atualizarQuandoVisivel);

    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener("focus", atualizarQuandoVisivel);
      document.removeEventListener("visibilitychange", atualizarQuandoVisivel);
    };
  }, []);

  const reservasPorStatus = reports?.reservas?.agrupadasPorStatus?.map((item) => ({
    label: statusReserva(item.status),
    value: Number(item.total),
  })) || [];
  const reservasPorStatusMap = Object.fromEntries(
    (reports?.reservas?.agrupadasPorStatus || []).map((item) => [
      item.status,
      Number(item.total || 0),
    ]),
  );

  const modalidades = reports?.modalidades?.modalidades?.map((item) => ({
    label: item.nome,
    value: Number(item.totalReservas || 0),
  })) || [];
  const funilReserva = reports?.funil || {};
  const metricasFunil = (chave) =>
    funilReserva[chave] || { totalAcessos: 0, visitantesUnicos: 0 };
  const detalheAcessos = (metrica, singular = "acesso", plural = "acessos") => {
    const total = Number(metrica?.totalAcessos || 0);
    if (!total) return "Sem acessos novos";
    return `${total} ${total === 1 ? singular : plural}`;
  };
  const marcacaoReserva = metricasFunil("marcacao");
  const dadosReserva = metricasFunil("dados");
  const pagamentoReserva = metricasFunil("pagamento");
  const pagamentoGerado = metricasFunil("pagamentoGerado");

  const highlights = reports
    ? [
        { label: "Total de reservas", value: reports.reservas.total },
        {
          label: "Marcar reserva",
          value: marcacaoReserva.visitantesUnicos,
          detail: detalheAcessos(marcacaoReserva, "visita na pagina", "visitas na pagina"),
          tone: "blue",
        },
        {
          label: "Dados da reserva",
          value: dadosReserva.visitantesUnicos,
          detail: detalheAcessos(dadosReserva, "chegou aos dados", "chegaram aos dados"),
          tone: "green",
        },
        {
          label: "Chegaram ao pagamento",
          value: pagamentoReserva.visitantesUnicos,
          detail: detalheAcessos(pagamentoReserva, "chegou ao pagamento", "chegaram ao pagamento"),
          tone: "orange",
        },
        {
          label: "Pagamentos gerados",
          value: reports.reservas.pagamentosGerados || 0,
          detail: pagamentoGerado.totalAcessos
            ? detalheAcessos(pagamentoGerado, "pessoa no funil", "pessoas no funil")
            : "Pix ou checkout criados",
          tone: "sand",
        },
        {
          label: "Pagaram",
          value: reports.reservas.pagamentosAprovados || 0,
          detail: "pagamentos aprovados",
          tone: "green",
        },
        {
          label: "Confirmadas",
          value: reservasPorStatusMap.confirmada || 0,
          detail: "reservas confirmadas",
        },
        {
          label: "Canceladas",
          value: reservasPorStatusMap.cancelada || 0,
          detail: "reservas canceladas",
        },
        {
          label: "Expiradas",
          value: reservasPorStatusMap.expirada || 0,
          detail: "reservas expiradas",
        },
      ]
    : [];

  return (
    <div className="admin-page">
      <AdminState
        error={error}
        isLoading={isLoading}
        loadingText="Carregando relatorios..."
      />
      <section className="admin-grid admin-grid--two">
        <Panel title="Reservas por status">
          <SimpleChart items={reservasPorStatus} />
        </Panel>
        <Panel title="Reservas por modalidade">
          <div className="admin-report-bars">
            {modalidades.map((item) => (
              <div key={item.label}>
                <span>
                  {item.label}
                  <strong>{item.value}</strong>
                </span>
                <i style={{ width: `${Math.min(Number(item.value) * 10, 100)}%` }} />
              </div>
            ))}
          </div>
        </Panel>
      </section>
      <section className="admin-stats admin-stats--reports">
        {highlights.map((item) => (
          <article className={`admin-stat admin-stat--${item.tone || "sand"}`} key={item.label}>
            <span>{item.label}</span>
            <strong>{item.value}</strong>
            <small>{item.detail || "Dados atualizados"}</small>
          </article>
        ))}
      </section>
    </div>
  );
}

function Panel({ action, children, className = "", onAction, title }) {
  return (
    <section className={`admin-panel${className ? ` ${className}` : ""}`}>
      <header>
        <h2>{title}</h2>
        {action && onAction && (
          <button type="button" onClick={onAction}>
            {action}
          </button>
        )}
        {action && !onAction && <span className="admin-panel__badge">{action}</span>}
      </header>
      {children}
    </section>
  );
}

function Toolbar({ buttonLabel, onButtonClick, showFilter = false, showSearch = false, title }) {
  const hasActions = showSearch || showFilter || (buttonLabel && onButtonClick);

  return (
    <div className="admin-toolbar">
      <div>
        <h2>{title}</h2>
        <p>Informações atualizadas quando o sistema estiver disponível.</p>
      </div>
      {hasActions && (
        <div>
          {showSearch && <SearchInput placeholder="Pesquisar" />}
          {showFilter && (
            <button className="admin-filter" type="button">
              <Filter aria-hidden="true" size={17} />
              Filtros
            </button>
          )}
          {buttonLabel && onButtonClick && (
            <AdminButton onClick={onButtonClick}>
              <Plus aria-hidden="true" size={17} />
              {buttonLabel}
            </AdminButton>
          )}
        </div>
      )}
    </div>
  );
}

function SearchInput({ onChange, placeholder, value }) {
  return (
    <label className="admin-search">
      <Search aria-hidden="true" size={17} />
      <input
        type="search"
        placeholder={placeholder}
        value={value ?? ""}
        onChange={(event) => onChange?.(event.target.value)}
      />
    </label>
  );
}

function AdminButton({ children, variant = "primary", ...props }) {
  return (
    <button className={`admin-button admin-button--${variant}`} type="button" {...props}>
      {children}
    </button>
  );
}

function StatusBadge({ status }) {
  const normalized = status
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\s+/g, "-");

  return <span className={`admin-status admin-status--${normalized}`}>{status}</span>;
}

function ReservationSummary({ reservation }) {
  return (
    <article className="admin-reservation-summary">
      <div>
        <strong>{reservation.time}</strong>
        <small>{reservation.date}</small>
      </div>
      <span>
        <strong>{reservation.customer}</strong>
        <small>
          {reservation.court} • {reservation.modality}
        </small>
      </span>
      <StatusBadge status={reservation.status} />
    </article>
  );
}

function ResponsiveTable({ children, className = "", columns }) {
  return (
    <div className="admin-table-wrap">
      <table className={`admin-table${className ? ` ${className}` : ""}`}>
        <thead>
          <tr>
            {columns.map((column) => (
              <th key={column}>{column}</th>
            ))}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}

function SimpleChart({ items }) {
  const maxValue = useMemo(
    () => Math.max(1, ...items.map((item) => item.value)),
    [items],
  );

  return (
    <div className="admin-simple-chart">
      {items.map((item) => (
        <div key={item.label}>
          <span>{item.value}</span>
          <i style={{ height: `${(item.value / maxValue) * 100}%` }} />
          <small>{item.label}</small>
        </div>
      ))}
    </div>
  );
}
