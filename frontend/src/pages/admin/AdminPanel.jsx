import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  AlertTriangle,
  CalendarDays,
  Archive,
  BarChart3,
  Bell,
  CalendarCheck,
  Check,
  ChevronDown,
  ChevronRight,
  CircleCheck,
  CircleDollarSign,
  CircleX,
  Clock3,
  CreditCard,
  Ellipsis,
  Eye,
  EyeOff,
  Filter,
  ImagePlus,
  LayoutDashboard,
  LockKeyhole,
  LogOut,
  Mail,
  Megaphone,
  Menu,
  Moon,
  Pencil,
  Plus,
  RotateCw,
  Search,
  ShieldCheck,
  Sun,
  UsersRound,
  LayoutGrid,
  ReceiptText,
  X,
} from "lucide-react";
import {
  DashboardReservationsCard,
  HourlyOccupancyChart,
  PaymentsSummaryCard,
  QuickSummaryCard,
} from "../../features/admin-insights/components/DashboardInsights";
import {
  ConversionFunnel,
  ModalityPerformanceTable,
  ReservationsEvolutionCard,
  StatusReportCard,
} from "../../features/admin-insights/components/ReportsInsights";
import { DashboardSkeleton, MetricCard } from "../../features/admin-insights/components/AdminDataViz";
import {
  formatCurrency,
  getPeriodBounds,
  isSameLocalDate,
  isWithinBounds,
  paymentLocalDate,
  percentageChange,
  toIsoDate,
  toLocalDate,
} from "../../features/admin-insights/utils/insightData";
import { getCourtImage } from "../../constants/courtImages";
import { enviarArquivo } from "../../services/arquivoService";
import {
  buscarAdministradorAtual,
  getAdmin,
  login as loginAdmin,
  logout as logoutAdmin,
} from "../../services/authService";
import {
  arquivarComunicado,
  criarComunicado,
  listarComunicados,
  publicarComunicado,
} from "../../services/comunicadoService";
import {
  alterarStatusCliente,
  listarClientes,
} from "../../services/clienteService";
import {
  alterarStatusModalidade,
  atualizarModalidade,
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

const EMPTY_INSIGHT_ITEMS = [];

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

function mesmaDataAdmin(dataA, dataB) {
  return Boolean(dataA && dataB)
    && dataA.getFullYear() === dataB.getFullYear()
    && dataA.getMonth() === dataB.getMonth()
    && dataA.getDate() === dataB.getDate();
}

function reservaNoPeriodo(data, periodo) {
  if (!periodo) return true;

  const dataReserva = obterDataAdmin(data);
  if (!dataReserva) return false;

  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);

  if (periodo === "hoje") return mesmaDataAdmin(dataReserva, hoje);
  if (periodo === "mes") {
    return dataReserva.getFullYear() === hoje.getFullYear()
      && dataReserva.getMonth() === hoje.getMonth();
  }

  if (periodo === "semana") {
    const inicioSemana = new Date(hoje);
    inicioSemana.setDate(hoje.getDate() - ((hoje.getDay() + 6) % 7));
    const fimSemana = new Date(inicioSemana);
    fimSemana.setDate(inicioSemana.getDate() + 6);
    return dataReserva >= inicioSemana && dataReserva <= fimSemana;
  }

  return true;
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
  imagemArquivo: null,
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

function iniciaisAdministrador(nome = "") {
  const partes = String(nome || "Administrador")
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  return partes
    .slice(0, 2)
    .map((parte) => parte[0])
    .join("")
    .toUpperCase() || "AD";
}

function formatarPerfilAdministrador(permissao = "administrador") {
  return String(permissao || "administrador")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (letra) => letra.toUpperCase());
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
      sidebarCollapsed={sidebarCollapsed}
      sidebarOpen={sidebarOpen}
      onCloseSidebar={() => setSidebarOpen(false)}
      onNavigate={navigate}
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
  onToggleSidebar,
  sidebarCollapsed,
  sidebarOpen,
}) {
  const currentPage = pageTitles[currentRoute] || pageTitles.dashboard;
  const [isDarkMode, setIsDarkMode] = useState(() => localStorage.getItem("admin-theme") === "dark");
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [notificationsLoading, setNotificationsLoading] = useState(false);
  const [adminUser, setAdminUser] = useState(() => getAdmin());
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef(null);
  const formattedToday = useMemo(
    () =>
      new Intl.DateTimeFormat("pt-BR", {
        day: "2-digit",
        month: "short",
        weekday: "short",
      })
        .format(new Date())
        .replace(/\.$/, "")
        .replace(/^./, (letra) => letra.toUpperCase()),
    [],
  );
  const adminName = adminUser?.nome || "Administrador";
  const adminProfile = formatarPerfilAdministrador(adminUser?.permissao);
  const adminInitials = iniciaisAdministrador(adminName);

  useEffect(() => {
    localStorage.setItem("admin-theme", isDarkMode ? "dark" : "light");
  }, [isDarkMode]);

  useEffect(() => {
    let active = true;

    buscarAdministradorAtual()
      .then((administrador) => {
        if (active && administrador) setAdminUser(administrador);
      })
      .catch(() => undefined);

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    function handlePointerDown(event) {
      if (!userMenuRef.current?.contains(event.target)) {
        setUserMenuOpen(false);
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, []);

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
              src="/images/logo/logo-pe-na-areia-header-white.png"
              alt={brand.name}
            />
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
          <div className="admin-header__main">
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
              <div className="admin-header__identity">
                <div className="admin-header__meta">
                  <LayoutDashboard aria-hidden="true" size={13} />
                  <span>{currentPage.eyebrow}</span>
                  <button
                    className="admin-header__date"
                    type="button"
                    aria-label={`Data atual: ${formattedToday}`}
                    title={`Data atual: ${formattedToday}`}
                  >
                    <span>{formattedToday}</span>
                  </button>
                </div>
                <h1>{currentPage.title}</h1>
                <p>{currentPage.description}</p>
              </div>
            </div>
          </div>
          <div className="admin-header__actions" aria-label="Acoes do painel">
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
            <div className="admin-user-menu" ref={userMenuRef}>
              <button
                className="admin-user"
                type="button"
                aria-expanded={userMenuOpen}
                aria-label="Abrir menu da conta"
                onClick={() => setUserMenuOpen((current) => !current)}
              >
                <span>{adminInitials}</span>
                <div>
                  <strong>{adminName}</strong>
                  <small>{adminProfile}</small>
                </div>
                <ChevronDown aria-hidden="true" size={15} />
              </button>
              {userMenuOpen && (
                <div className="admin-user-menu__panel" role="menu">
                  <button type="button" role="menuitem" onClick={onLogout}>
                    <LogOut aria-hidden="true" size={16} />
                    Sair da conta
                  </button>
                </div>
              )}
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
    relatorios: <ReportsScreen onNavigate={onNavigate} />,
  };

  return screens[route] || screens.dashboard;
}

function DashboardScreen({ onNavigate }) {
  const [dashboard, setDashboard] = useState(null);
  const [reservas, setReservas] = useState([]);
  const [horarios, setHorarios] = useState([]);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let active = true;

    async function carregarDashboard() {
      try {
        const [dashboardData, reservasData, horariosData] = await Promise.all([
          buscarDashboard(),
          listarReservas(),
          listarHorarios({ data: toIsoDate() }),
        ]);
        if (!active) return;
        setDashboard(dashboardData);
        setReservas(reservasData);
        setHorarios(horariosData);
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

  const today = useMemo(() => {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    return date;
  }, []);
  const yesterday = useMemo(() => new Date(today.getFullYear(), today.getMonth(), today.getDate() - 1), [today]);
  const reservationsToday = useMemo(
    () => reservas.filter((reserva) => isSameLocalDate(toLocalDate(reserva.data), today)),
    [reservas, today],
  );
  const reservationsYesterday = useMemo(
    () => reservas.filter((reserva) => isSameLocalDate(toLocalDate(reserva.data), yesterday)),
    [reservas, yesterday],
  );
  const pendingReservations = useMemo(
    () => reservas.filter((reserva) => reserva.status === "aguardando_pagamento" || reserva.pagamentoStatus === "pendente"),
    [reservas],
  );
  const hourlyOccupancy = useMemo(() => {
    const byHour = new Map();
    horarios.forEach((horario) => {
      const label = String(horario.horaInicio || "").slice(0, 5);
      if (!label) return;
      const current = byHour.get(label) || { label, reserved: 0, total: 0 };
      current.total += 1;
      if (horario.status === "reservado") current.reserved += 1;
      byHour.set(label, current);
    });
    return [...byHour.values()]
      .sort((first, second) => first.label.localeCompare(second.label))
      .map((item) => ({ ...item, rate: Math.round((item.reserved / item.total) * 100) }));
  }, [horarios]);
  const occupancyToday = horarios.length
    ? Math.round((horarios.filter((horario) => horario.status === "reservado").length / horarios.length) * 100)
    : 0;
  const payments = useMemo(() => {
    const now = new Date();
    const isCurrentMonth = (reserva) => {
      const date = paymentLocalDate(reserva);
      return Boolean(date && date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth());
    };
    const isPreviousMonth = (reserva) => {
      const date = paymentLocalDate(reserva);
      const previous = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      return Boolean(date && date.getFullYear() === previous.getFullYear() && date.getMonth() === previous.getMonth());
    };
    const sumApproved = (items) => items
      .filter((reserva) => reserva.pagamentoStatus === "aprovado")
      .reduce((total, reserva) => total + Number(reserva.valorTotal || 0), 0);
    const monthRevenue = sumApproved(reservas.filter(isCurrentMonth));
    const previousRevenue = sumApproved(reservas.filter(isPreviousMonth));
    return {
      approvedCount: reservas.filter((reserva) => reserva.pagamentoStatus === "aprovado" && isCurrentMonth(reserva)).length,
      monthChange: percentageChange(monthRevenue, previousRevenue),
      monthRevenue,
      pendingCount: pendingReservations.length,
    };
  }, [pendingReservations.length, reservas]);
  const dashboardMetrics = useMemo(() => {
    const dailyTrend = Array.from({ length: 7 }, (_, index) => {
      const date = new Date(today.getFullYear(), today.getMonth(), today.getDate() - (6 - index));
      return reservas.filter((reserva) => isSameLocalDate(toLocalDate(reserva.data), date)).length;
    });
    const revenueToday = reservas
      .filter((reserva) => reserva.pagamentoStatus === "aprovado" && isSameLocalDate(paymentLocalDate(reserva), today))
      .reduce((total, reserva) => total + Number(reserva.valorTotal || 0), 0);
    const yesterdayRevenue = reservas
      .filter((reserva) => reserva.pagamentoStatus === "aprovado" && isSameLocalDate(paymentLocalDate(reserva), yesterday))
      .reduce((total, reserva) => total + Number(reserva.valorTotal || 0), 0);
    const reservationsChange = percentageChange(reservationsToday.length, reservationsYesterday.length);
    const revenueChange = percentageChange(revenueToday, yesterdayRevenue);
    return [
      { label: "Reservas hoje", value: dashboard?.reservasHoje ?? reservationsToday.length, detail: reservationsChange === null ? "Dados da data atual" : `${reservationsChange >= 0 ? "+" : ""}${reservationsChange}% vs. ontem`, icon: CalendarDays, tone: "blue", sparkline: dailyTrend },
      { label: "Ocupação hoje", value: horarios.length ? `${occupancyToday}%` : "--", detail: horarios.length ? `${horarios.filter((horario) => horario.status === "reservado").length} de ${horarios.length} horários` : "Sem horários cadastrados", icon: Clock3, tone: "orange", sparkline: hourlyOccupancy.map((item) => item.rate) },
      { label: "Receita hoje", value: formatCurrency(revenueToday), detail: revenueChange === null ? "Sem base anterior" : `${revenueChange >= 0 ? "+" : ""}${revenueChange}% vs. ontem`, icon: CircleDollarSign, tone: "green", sparkline: dailyTrend.map((value) => value || 0) },
      { label: "Pendências", value: pendingReservations.length, detail: pendingReservations.length ? "Reservas aguardando pagamento" : "Nenhuma pendência operacional", icon: CircleX, tone: "purple", sparkline: dailyTrend.map((value, index) => Math.max(0, value - index)) },
    ];
  }, [dashboard?.reservasHoje, horarios, hourlyOccupancy, occupancyToday, pendingReservations.length, reservas, reservationsToday, reservationsYesterday, today, yesterday]);
  const nextReservations = useMemo(
    () => reservas
      .filter((reserva) => {
        const date = toLocalDate(reserva.data);
        return date && date >= today && !["cancelada", "expirada"].includes(reserva.status);
      })
      .sort((first, second) => `${first.data} ${first.horaInicio}`.localeCompare(`${second.data} ${second.horaInicio}`))
      .slice(0, 4),
    [reservas, today],
  );
  const quickSummary = [
    { id: "reservations", label: "Reservas esta semana", detail: `${dashboard?.reservasSemana ?? 0} no período atual`, route: "reservas", tone: "blue" },
    { id: "occupancy", label: "Ocupação de hoje", detail: horarios.length ? `${occupancyToday}% dos horários ocupados` : "Sem horários cadastrados", route: "horarios", tone: "orange" },
    { id: "pending", label: "Pendências operacionais", detail: pendingReservations.length ? `${pendingReservations.length} para revisar` : "Nenhuma pendência", route: "reservas", tone: "purple" },
  ];

  return (
    <div className="admin-page admin-page--dashboard">
      <AdminState
        error={error}
        isLoading={false}
      />
      {isLoading ? <DashboardSkeleton /> : !error && <>
        <section className="admin-insight-metrics" aria-label="Indicadores do dashboard">
          {dashboardMetrics.map((metric) => <MetricCard key={metric.label} {...metric} />)}
        </section>
        <section className="admin-dashboard-grid">
          <DashboardReservationsCard reservations={nextReservations} onNavigate={onNavigate} />
          <div className="admin-dashboard-side"><PaymentsSummaryCard payments={payments} onNavigate={onNavigate} /><QuickSummaryCard items={quickSummary} onNavigate={onNavigate} /></div>
        </section>
        <HourlyOccupancyChart items={hourlyOccupancy} />
      </>}
    </div>
  );
}

function ReservationsScreen({ searchQuery = "" }) {
  const [reservas, setReservas] = useState([]);
  const [filtros, setFiltros] = useState({
    status: "",
    modalidade: "",
    pagamento: "",
    periodo: "",
    quadra: "",
  });
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

  const opcoesFiltro = useMemo(() => ({
    modalidades: [...new Set(reservas.map((reserva) => reserva.modalidade?.nome).filter(Boolean))].sort(),
    pagamentos: [...new Set(reservas.map((reserva) => reserva.pagamentoStatus).filter(Boolean))].sort(),
    quadras: [...new Set(reservas.map((reserva) => reserva.quadra?.nome).filter(Boolean))].sort(),
  }), [reservas]);

  const reservasFiltradas = useMemo(() => {
    const termo = normalizarBusca(searchQuery);

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
      const correspondeBusca = !termo || valores.some((valor) => normalizarBusca(valor).includes(termo));
      const correspondeStatus = !filtros.status || reservation.status === filtros.status;
      const correspondeModalidade = !filtros.modalidade || reservation.modalidade?.nome === filtros.modalidade;
      const correspondeQuadra = !filtros.quadra || reservation.quadra?.nome === filtros.quadra;
      const correspondePagamento = !filtros.pagamento || reservation.pagamentoStatus === filtros.pagamento;
      const correspondePeriodo = reservaNoPeriodo(reservation.data, filtros.periodo);

      return correspondeBusca
        && correspondeStatus
        && correspondeModalidade
        && correspondeQuadra
        && correspondePagamento
        && correspondePeriodo;
    });
  }, [filtros, reservas, searchQuery]);

  const resumoReservas = useMemo(() => {
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    const reservasHoje = reservas.filter((reserva) => mesmaDataAdmin(obterDataAdmin(reserva.data), hoje)).length;

    return reservasFiltradas.reduce(
      (resumo, reserva) => {
        resumo.total += 1;
        resumo[reserva.status] = (resumo[reserva.status] || 0) + 1;
        return resumo;
      },
      {
        total: 0,
        confirmada: 0,
        aguardando_pagamento: 0,
        cancelada: 0,
        reservasHoje,
      },
    );
  }, [reservas, reservasFiltradas]);

  const atualizarFiltro = (campo, valor) => {
    setFiltros((atual) => ({ ...atual, [campo]: valor }));
  };

  return (
    <div className="admin-page admin-page--reservations">
      <AdminState
        error={error}
        isLoading={isLoading}
        empty={!reservas.length}
        loadingText="Carregando reservas..."
        emptyText="Nenhuma reserva encontrada."
      />
      {feedback && <p className="admin-success">{feedback}</p>}
      {!isLoading && !error && reservas.length > 0 && (
        <>
          <section className="admin-filter-card admin-reservations__filters" aria-label="Filtros de reservas">
            <AdminFilterField label="Status">
              <select value={filtros.status} onChange={(event) => atualizarFiltro("status", event.target.value)}>
                <option value="">Todos os status</option>
                <option value="confirmada">Confirmada</option>
                <option value="aguardando_pagamento">Pendente</option>
                <option value="cancelada">Cancelada</option>
                <option value="finalizada">Finalizada</option>
                <option value="expirada">Expirada</option>
              </select>
            </AdminFilterField>
            <AdminFilterField label="Modalidade">
              <select value={filtros.modalidade} onChange={(event) => atualizarFiltro("modalidade", event.target.value)}>
                <option value="">Todas as modalidades</option>
                {opcoesFiltro.modalidades.map((modalidade) => <option key={modalidade} value={modalidade}>{modalidade}</option>)}
              </select>
            </AdminFilterField>
            <AdminFilterField label="Quadra">
              <select value={filtros.quadra} onChange={(event) => atualizarFiltro("quadra", event.target.value)}>
                <option value="">Todas as quadras</option>
                {opcoesFiltro.quadras.map((quadra) => <option key={quadra} value={quadra}>{quadra}</option>)}
              </select>
            </AdminFilterField>
            <AdminFilterField label="Pagamento">
              <select value={filtros.pagamento} onChange={(event) => atualizarFiltro("pagamento", event.target.value)}>
                <option value="">Todos os pagamentos</option>
                {opcoesFiltro.pagamentos.map((pagamento) => <option key={pagamento} value={pagamento}>{statusPagamento(pagamento)}</option>)}
              </select>
            </AdminFilterField>
            <AdminFilterField label="Período">
              <select value={filtros.periodo} onChange={(event) => atualizarFiltro("periodo", event.target.value)}>
                <option value="">Todas as datas</option>
                <option value="hoje">Hoje</option>
                <option value="semana">Esta semana</option>
                <option value="mes">Este mês</option>
              </select>
            </AdminFilterField>
            <button className="admin-filter-card__clear" type="button" onClick={() => setFiltros({ status: "", modalidade: "", pagamento: "", periodo: "", quadra: "" })}>
              <RotateCw aria-hidden="true" size={15} />
              Limpar filtros
            </button>
          </section>

          <section className="admin-metric-grid" aria-label="Indicadores de reservas">
            <AdminMetricCard detail="na data atual" icon={CalendarDays} label="Reservas hoje" tone="blue" value={resumoReservas.reservasHoje} />
            <AdminMetricCard detail="no recorte atual" icon={CircleCheck} label="Confirmadas" tone="green" value={resumoReservas.confirmada} />
            <AdminMetricCard detail="aguardando pagamento" icon={Clock3} label="Pendentes" tone="orange" value={resumoReservas.aguardando_pagamento} />
            <AdminMetricCard detail="no recorte atual" icon={CircleX} label="Canceladas" tone="red" value={resumoReservas.cancelada} />
          </section>

          <Panel action={`${reservasFiltradas.length} registro${reservasFiltradas.length === 1 ? "" : "s"}`} className="admin-panel--reservation-table" title="Lista de reservas">
            {reservasFiltradas.length === 0 ? (
              <p className="admin-empty-inline">Nenhuma reserva encontrada para os filtros selecionados.</p>
            ) : (
          <ResponsiveTable
            className="admin-reservations-table"
            columns={["Cliente", "Quadra", "Modalidade", "Data", "Horário", "Status", "Pagamento", "Ações"]}
          >
            {reservasFiltradas.map((reservation) => (
              <tr key={reservation.id}>
                <td data-label="Cliente">
                  <ReservationCustomer customer={reservation.cliente} />
                </td>
                <td data-label="Quadra">{reservation.quadra?.nome || "--"}</td>
                <td data-label="Modalidade">{reservation.modalidade?.nome || "--"}</td>
                <td data-label="Data">
                  <ReservationDate value={reservation.data} />
                </td>
                <td data-label="Horário">
                  <span className="admin-time-chip">{formatarHoraAdmin(reservation.horaInicio)}</span>
                </td>
                <td data-label="Status">
                  <StatusBadge status={statusReserva(reservation.status)} />
                </td>
                <td data-label="Pagamento">
                  <StatusBadge status={statusPagamento(reservation.pagamentoStatus)} />
                </td>
                <td data-label="Ações">
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
        </>
      )}
    </div>
  );
}

function AdminFilterField({ children, label }) {
  return <label className="admin-filter-field"><span>{label}</span>{children}</label>;
}

function AdminMetricCard({ detail, icon: Icon, label, tone, value }) {
  return (
    <article className={`admin-metric-card admin-metric-card--${tone}`}>
      <span className="admin-metric-card__icon"><Icon aria-hidden="true" size={18} /></span>
      <div>
        <small>{label}</small>
        <strong>{value}</strong>
        <em>{detail}</em>
      </div>
    </article>
  );
}

function ReservationCustomer({ customer }) {
  const nome = customer?.nome || "--";
  const avatar = customer?.avatarUrl || customer?.fotoUrl || customer?.foto;

  return (
    <div className="admin-reservation-customer">
      <span className="admin-reservation-customer__avatar">
        {avatar ? <img src={avatar} alt="" /> : iniciaisAdministrador(nome)}
      </span>
      <span>
        <strong>{nome}</strong>
        <small>{customer?.telefone || customer?.email || "Sem contato informado"}</small>
      </span>
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
    <details className="admin-row-menu">
      <summary aria-label={`Ações da reserva ${reservation.id}`} title="Ações da reserva">
        <Ellipsis aria-hidden="true" size={18} />
      </summary>
      <div className="admin-row-menu__panel">
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
            onClick={(event) => {
              event.currentTarget.closest("details")?.removeAttribute("open");
              onAction({ acao, id: reservation.id, key, successMessage });
            }}
          >
            <Icon aria-hidden="true" size={15} />
            <span>{isSaving ? "Salvando..." : label}</span>
          </button>
        );
      })}
      </div>
    </details>
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

  const atualizarImagemCadastro = (arquivo) => {
    setCourtForm((atual) => ({
      ...atual,
      imagemArquivo: arquivo,
      imagemUrl: arquivo ? "" : atual.imagemUrl,
    }));
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
      let imagemUrl = courtForm.imagemUrl.trim();
      if (courtForm.imagemArquivo) {
        const upload = await enviarArquivo(courtForm.imagemArquivo, { entidade: "quadra" });
        imagemUrl = upload?.arquivo?.url || "";
      }

      await criarQuadra({
        nome: courtForm.nome.trim(),
        descricao: courtForm.descricao.trim(),
        valorHora,
        imagemUrl,
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
    <div className="admin-page admin-page--courts">
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
                Imagem da quadra
                <input
                  value={courtForm.imagemUrl}
                  onChange={(event) => atualizarCampoCadastro("imagemUrl", event.target.value)}
                  placeholder="Cole uma URL ou selecione uma foto abaixo"
                  disabled={Boolean(courtForm.imagemArquivo)}
                />
              </label>
              <div className="admin-form__wide admin-court-image-picker">
                <label htmlFor="court-image-file">
                  <ImagePlus aria-hidden="true" size={18} />
                  <span>{courtForm.imagemArquivo ? "Trocar foto" : "Selecionar foto"}</span>
                  <input
                    key={courtForm.imagemArquivo?.name || "court-image-empty"}
                    id="court-image-file"
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={(event) => atualizarImagemCadastro(event.target.files?.[0] || null)}
                  />
                </label>
                <div>
                  <strong>{courtForm.imagemArquivo?.name || "Nenhuma foto selecionada"}</strong>
                  <small>JPG, PNG ou WebP. Se selecionar uma foto, a URL manual fica desativada.</small>
                </div>
                {courtForm.imagemArquivo && (
                  <button type="button" onClick={() => atualizarImagemCadastro(null)}>
                    Remover foto
                  </button>
                )}
              </div>
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
  const [editingDescriptionId, setEditingDescriptionId] = useState(null);
  const [descriptionDraft, setDescriptionDraft] = useState("");
  const [savingDescriptionId, setSavingDescriptionId] = useState(null);

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

  const abrirEdicaoDescricao = (modalidade) => {
    setFeedback("");
    setError("");
    setEditingDescriptionId(modalidade.id);
    setDescriptionDraft(modalidade.descricao || "");
  };

  const cancelarEdicaoDescricao = () => {
    setEditingDescriptionId(null);
    setDescriptionDraft("");
  };

  const salvarDescricao = async (event, modalidade) => {
    event.preventDefault();
    setFeedback("");
    setError("");
    setSavingDescriptionId(modalidade.id);
    try {
      const response = await atualizarModalidade(modalidade.id, {
        nome: modalidade.nome,
        descricao: descriptionDraft,
      });
      const modalidadeAtualizada = response.modalidade || {
        ...modalidade,
        descricao: descriptionDraft.trim() || null,
      };
      setModalidades((atuais) => atuais.map((item) => (item.id === modalidade.id ? modalidadeAtualizada : item)));
      setFeedback("Descrição da modalidade atualizada.");
      cancelarEdicaoDescricao();
    } catch (requestError) {
      setError(requestError.message || "Não foi possível salvar a descrição da modalidade.");
    } finally {
      setSavingDescriptionId(null);
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
                <td>
                  {editingDescriptionId === modalidade.id ? (
                    <form className="admin-modality-description-form" onSubmit={(event) => salvarDescricao(event, modalidade)}>
                      <label className="sr-only" htmlFor={`modalidade-descricao-${modalidade.id}`}>
                        Descrição da modalidade {modalidade.nome}
                      </label>
                      <textarea
                        id={`modalidade-descricao-${modalidade.id}`}
                        value={descriptionDraft}
                        onChange={(event) => setDescriptionDraft(event.target.value)}
                        placeholder="Adicione uma descrição curta para esta modalidade."
                        rows={3}
                      />
                      <div>
                        <button type="submit" disabled={savingDescriptionId === modalidade.id}>
                          <Check aria-hidden="true" size={15} />
                          <span>{savingDescriptionId === modalidade.id ? "Salvando..." : "Salvar"}</span>
                        </button>
                        <button type="button" onClick={cancelarEdicaoDescricao} disabled={savingDescriptionId === modalidade.id}>
                          <X aria-hidden="true" size={15} />
                          <span>Cancelar</span>
                        </button>
                      </div>
                    </form>
                  ) : (
                    <p className="admin-modality-description">{modalidade.descricao || "Sem descrição cadastrada."}</p>
                  )}
                </td>
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
                    <button type="button" onClick={() => abrirEdicaoDescricao(modalidade)}>
                      <Pencil aria-hidden="true" size={15} />
                      <span>Editar descrição</span>
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

            <div className="admin-filter-card admin-schedule__filters" aria-label="Filtros da agenda">
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

            <section className="admin-metric-grid" aria-label="Resumo dos horários filtrados">
              <AdminMetricCard detail={recorteDetalhe} icon={Clock3} label="Horários exibidos" tone="blue" value={resumoHorarios.total} />
              <AdminMetricCard detail={`${resumoHorarios.percentualLivre}% disponível`} icon={CircleCheck} label="Livres" tone="green" value={resumoHorarios.disponivel} />
              <AdminMetricCard detail={`${resumoHorarios.percentualReservado}% do recorte`} icon={CalendarCheck} label="Reservados" tone="blue" value={resumoHorarios.reservado} />
              <AdminMetricCard detail={`${resumoHorarios.percentualBloqueado}% indisponível`} icon={CircleX} label="Bloqueados" tone="red" value={resumoHorarios.bloqueado} />
            </section>

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
                        const detalheSlot = slot.reserva?.cliente?.nome
                          || slot.cliente?.nome
                          || slot.motivoBloqueio
                          || slot.motivo;
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
                            {detalheSlot && <em>{detalheSlot}</em>}
                          </button>
                        );
                      })}
                    </div>
                  </article>
                ))}
              </div>
            )}
            {dataSelecionada && (
              <footer className="admin-schedule__footer">
                Horários exibidos para {dataSelecionada.full}.
              </footer>
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
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [createForm, setCreateForm] = useState({
    titulo: "",
    mensagem: "",
    destaque: false,
  });

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

  const atualizarCampoComunicado = (campo, valor) => {
    setCreateForm((atual) => ({ ...atual, [campo]: valor }));
  };

  const cancelarCadastroComunicado = () => {
    setIsCreateOpen(false);
    setCreateForm({ titulo: "", mensagem: "", destaque: false });
  };

  const salvarComunicado = async (event) => {
    event.preventDefault();
    setFeedback("");
    setError("");
    setIsCreating(true);
    try {
      await criarComunicado(createForm);
      setFeedback("Comunicado criado como rascunho.");
      cancelarCadastroComunicado();
      await carregarComunicados();
    } catch (requestError) {
      setError(requestError.message || "Não foi possível criar o comunicado.");
    } finally {
      setIsCreating(false);
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
      <Panel
        action={isCreateOpen ? "Fechar cadastro" : "Adicionar comunicado"}
        className="admin-panel--announcements"
        onAction={() => {
          if (isCreateOpen) {
            cancelarCadastroComunicado();
            return;
          }
          setFeedback("");
          setError("");
          setIsCreateOpen(true);
        }}
        title="Comunicados"
      >
        <AdminState
          error={error}
          isLoading={isLoading}
          empty={!comunicadosFiltrados.length}
          loadingText="Carregando comunicados..."
          emptyText={searchQuery ? "Nenhum comunicado encontrado para essa busca." : "Nenhum comunicado encontrado."}
        />
        {feedback && <p className="admin-success">{feedback}</p>}
        {isCreateOpen && (
          <form className="admin-form admin-form--stack admin-announcement-create" onSubmit={salvarComunicado}>
            <label>
              Título
              <input
                value={createForm.titulo}
                onChange={(event) => atualizarCampoComunicado("titulo", event.target.value)}
                placeholder="Ex.: Agenda aberta para a semana"
                required
              />
            </label>
            <label>
              Mensagem
              <textarea
                value={createForm.mensagem}
                onChange={(event) => atualizarCampoComunicado("mensagem", event.target.value)}
                placeholder="Escreva o aviso que aparecerá para os clientes."
                required
              />
            </label>
            <label className="admin-check admin-announcement-create__check">
              <input
                type="checkbox"
                checked={createForm.destaque}
                onChange={(event) => atualizarCampoComunicado("destaque", event.target.checked)}
              />
              Marcar como destaque
            </label>
            <div className="admin-modal__actions">
              <AdminButton type="button" variant="ghost" onClick={cancelarCadastroComunicado} disabled={isCreating}>
                Cancelar
              </AdminButton>
              <AdminButton type="submit" disabled={isCreating}>
                <Plus aria-hidden="true" size={17} />
                {isCreating ? "Salvando..." : "Salvar comunicado"}
              </AdminButton>
            </div>
          </form>
        )}
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

function ReportsScreen({ onNavigate }) {
  const [reports, setReports] = useState(null);
  const [filters, setFilters] = useState({ period: "all", status: "", modality: "", court: "" });
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let active = true;

    async function carregarRelatorios() {
      try {
        const [reservas, horarios, funil] = await Promise.all([
          listarReservas(),
          listarHorarios(),
          buscarRelatorioFunilReserva(),
        ]);
        if (active) setReports({ funil, horarios, reservas });
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
        const [reservas, horarios, funil] = await Promise.all([
          listarReservas(),
          listarHorarios(),
          buscarRelatorioFunilReserva(),
        ]);
        setReports({ funil, horarios, reservas });
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

  const reservations = reports?.reservas || EMPTY_INSIGHT_ITEMS;
  const scheduleSlots = reports?.horarios || EMPTY_INSIGHT_ITEMS;
  const filterOptions = useMemo(() => ({
    courts: [...new Set(reservations.map((item) => item.quadra?.nome).filter(Boolean))].sort(),
    modalities: [...new Set(reservations.map((item) => item.modalidade?.nome).filter(Boolean))].sort(),
  }), [reservations]);
  const currentBounds = useMemo(() => getPeriodBounds(filters.period), [filters.period]);
  const matchesFilters = useCallback((reservation, bounds = currentBounds) => (
    isWithinBounds(reservation.data, bounds)
    && (!filters.status || reservation.status === filters.status)
    && (!filters.modality || reservation.modalidade?.nome === filters.modality)
    && (!filters.court || reservation.quadra?.nome === filters.court)
  ), [currentBounds, filters.court, filters.modality, filters.status]);
  const filteredReservations = useMemo(
    () => reservations.filter((reservation) => matchesFilters(reservation)),
    [matchesFilters, reservations],
  );
  const previousReservations = useMemo(
    () => currentBounds ? reservations.filter((reservation) => matchesFilters(reservation, { start: currentBounds.previousStart, end: currentBounds.previousEnd })) : [],
    [currentBounds, matchesFilters, reservations],
  );
  const filteredSlots = useMemo(
    () => scheduleSlots.filter((slot) => isWithinBounds(slot.data, currentBounds) && (!filters.court || slot.quadra?.nome === filters.court)),
    [currentBounds, filters.court, scheduleSlots],
  );
  const statusTotals = useMemo(() => filteredReservations.reduce((total, reservation) => {
    total[reservation.status] = (total[reservation.status] || 0) + 1;
    return total;
  }, {}), [filteredReservations]);
  const approvedRevenue = useCallback((items) => items
    .filter((reservation) => reservation.pagamentoStatus === "aprovado")
    .reduce((total, reservation) => total + Number(reservation.valorTotal || 0), 0), []);
  const currentRevenue = approvedRevenue(filteredReservations);
  const previousRevenue = approvedRevenue(previousReservations);
  const confirmed = statusTotals.confirmada || 0;
  const cancelled = statusTotals.cancelada || 0;
  const expired = statusTotals.expirada || 0;
  const pendingPayments = filteredReservations.filter((reservation) => reservation.pagamentoStatus === "pendente").length;
  const occupancy = filteredSlots.length ? Math.round((filteredSlots.filter((slot) => slot.status === "reservado").length / filteredSlots.length) * 100) : null;
  const previousOccupancySlots = useMemo(
    () => currentBounds ? scheduleSlots.filter((slot) => isWithinBounds(slot.data, { start: currentBounds.previousStart, end: currentBounds.previousEnd }) && (!filters.court || slot.quadra?.nome === filters.court)) : [],
    [currentBounds, filters.court, scheduleSlots],
  );
  const previousOccupancy = previousOccupancySlots.length ? Math.round((previousOccupancySlots.filter((slot) => slot.status === "reservado").length / previousOccupancySlots.length) * 100) : null;
  const totalChange = percentageChange(filteredReservations.length, previousReservations.length);
  const confirmationRate = filteredReservations.length ? Math.round((confirmed / filteredReservations.length) * 100) : 0;
  const previousConfirmationRate = previousReservations.length ? Math.round((previousReservations.filter((reservation) => reservation.status === "confirmada").length / previousReservations.length) * 100) : null;
  const dailyEvolution = useMemo(() => {
    const totals = filteredReservations.reduce((map, reservation) => {
      const date = String(reservation.data || "").slice(0, 10);
      if (date) map.set(date, (map.get(date) || 0) + 1);
      return map;
    }, new Map());
    return [...totals.entries()].sort(([first], [second]) => first.localeCompare(second)).slice(-10).map(([date, value]) => ({
      label: new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit" }).format(toLocalDate(date)),
      value,
    }));
  }, [filteredReservations]);
  const rollingAverage = dailyEvolution.length >= 3
    ? dailyEvolution.map((_, index) => {
      const window = dailyEvolution.slice(Math.max(0, index - 2), index + 1);
      return window.reduce((sum, item) => sum + item.value, 0) / window.length;
    })
    : [];
  const statusItems = [
    { label: "Confirmadas", value: confirmed, color: "#22a06b" },
    { label: "Canceladas", value: cancelled, color: "#dd4d52" },
    { label: "Expiradas", value: expired, color: "#98a2b3" },
    { label: "Pendentes", value: statusTotals.aguardando_pagamento || 0, color: "#f28a30" },
    { label: "Finalizadas", value: statusTotals.finalizada || 0, color: "#2867c8" },
  ];
  const funnel = reports?.funil || {};
  const funnelItems = [
    { label: "Iniciaram a reserva", value: Number(funnel.marcacao?.visitantesUnicos || 0) },
    { label: "Preencheram os dados", value: Number(funnel.dados?.visitantesUnicos || 0) },
    { label: "Chegaram ao pagamento", value: Number(funnel.pagamento?.visitantesUnicos || 0) },
    { label: "Pagamento gerado", value: Number(funnel.pagamentoGerado?.visitantesUnicos || 0) },
    { label: "Confirmadas", value: confirmed },
  ];
  const modalityRows = useMemo(() => {
    const grouped = filteredReservations.reduce((map, reservation) => {
      const name = reservation.modalidade?.nome || "Sem modalidade";
      const current = map.get(name) || { name, total: 0, confirmed: 0, cancelled: 0 };
      current.total += 1;
      if (reservation.status === "confirmada") current.confirmed += 1;
      if (reservation.status === "cancelada") current.cancelled += 1;
      map.set(name, current);
      return map;
    }, new Map());
    return [...grouped.values()].map((item) => ({ ...item, conversion: item.total ? Math.round((item.confirmed / item.total) * 100) : 0 })).sort((first, second) => second.total - first.total);
  }, [filteredReservations]);
  const metricDetail = (change, fallback = "Dados do período") => change === null ? fallback : `${change >= 0 ? "+" : ""}${change}% vs. período anterior`;
  const metrics = [
    { label: "Total de reservas", value: filteredReservations.length, detail: metricDetail(totalChange), icon: CalendarDays, tone: "blue", sparkline: dailyEvolution.map((item) => item.value) },
    { label: "Receita recebida", value: formatCurrency(currentRevenue), detail: metricDetail(percentageChange(currentRevenue, previousRevenue), "Sem base anterior"), icon: CircleDollarSign, tone: "green", sparkline: dailyEvolution.map((item) => item.value) },
    { label: "Taxa de conversão", value: `${confirmationRate}%`, detail: metricDetail(percentageChange(confirmationRate, previousConfirmationRate)), icon: BarChart3, tone: "blue", sparkline: dailyEvolution.map((item) => item.value) },
    { label: "Taxa de ocupação", value: occupancy === null ? "--" : `${occupancy}%`, detail: occupancy === null ? "Sem horários no recorte" : metricDetail(percentageChange(occupancy, previousOccupancy)), icon: Clock3, tone: "orange", sparkline: filteredSlots.map((slot) => slot.status === "reservado" ? 1 : 0) },
    { label: "Confirmadas", value: confirmed, detail: `${confirmationRate}% do total`, icon: CircleCheck, tone: "green", sparkline: dailyEvolution.map((item) => item.value) },
    { label: "Canceladas", value: cancelled, detail: filteredReservations.length ? `${Math.round((cancelled / filteredReservations.length) * 100)}% do total` : "Sem reservas", icon: CircleX, tone: "red", sparkline: dailyEvolution.map((item) => item.value) },
    { label: "Expiradas", value: expired, detail: filteredReservations.length ? `${Math.round((expired / filteredReservations.length) * 100)}% do total` : "Sem reservas", icon: ReceiptText, tone: "purple", sparkline: dailyEvolution.map((item) => item.value) },
    { label: "Pagamentos pendentes", value: pendingPayments, detail: filteredReservations.length ? `${Math.round((pendingPayments / filteredReservations.length) * 100)}% do total` : "Sem reservas", icon: CreditCard, tone: "orange", sparkline: dailyEvolution.map((item) => item.value) },
  ];

  return (
    <div className="admin-page admin-page--reports">
      <AdminState
        error={error}
        isLoading={false}
      />
      {isLoading ? <DashboardSkeleton metrics={8} /> : !error && <>
        <section className="admin-report-filters" aria-label="Filtros dos relatórios">
          <label>Período<select value={filters.period} onChange={(event) => setFilters((current) => ({ ...current, period: event.target.value }))}><option value="all">Todo o período</option><option value="today">Hoje</option><option value="week">Esta semana</option><option value="month">Este mês</option></select></label>
          <label>Modalidade<select value={filters.modality} onChange={(event) => setFilters((current) => ({ ...current, modality: event.target.value }))}><option value="">Todas as modalidades</option>{filterOptions.modalities.map((item) => <option key={item} value={item}>{item}</option>)}</select></label>
          <label>Quadra<select value={filters.court} onChange={(event) => setFilters((current) => ({ ...current, court: event.target.value }))}><option value="">Todas as quadras</option>{filterOptions.courts.map((item) => <option key={item} value={item}>{item}</option>)}</select></label>
          <label>Status<select value={filters.status} onChange={(event) => setFilters((current) => ({ ...current, status: event.target.value }))}><option value="">Todos os status</option><option value="confirmada">Confirmada</option><option value="aguardando_pagamento">Aguardando pagamento</option><option value="cancelada">Cancelada</option><option value="expirada">Expirada</option><option value="finalizada">Finalizada</option></select></label>
          <button type="button" onClick={() => setFilters({ period: "all", status: "", modality: "", court: "" })}>Limpar filtros</button>
        </section>
        <section className="admin-insight-metrics admin-insight-metrics--reports" aria-label="Indicadores dos relatórios">{metrics.map((metric) => <MetricCard key={metric.label} {...metric} />)}</section>
        <section className="admin-report-grid"><StatusReportCard items={statusItems} total={filteredReservations.length} /><ReservationsEvolutionCard items={dailyEvolution} averages={rollingAverage} /><ConversionFunnel items={funnelItems} /><ModalityPerformanceTable items={modalityRows} onNavigate={onNavigate} /></section>
      </>}
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
