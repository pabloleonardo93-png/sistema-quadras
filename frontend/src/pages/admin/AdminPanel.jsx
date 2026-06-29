import { useEffect, useMemo, useState } from "react";
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
  UsersRound,
  Waves,
  X,
} from "lucide-react";
import { courtImages } from "../../constants/courtImages";
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
  listarQuadras,
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
  buscarRelatorioModalidades,
  buscarRelatorioOcupacao,
  buscarRelatorioReservas,
} from "../../services/relatorioService";

const navItems = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "reservas", label: "Reservas", icon: CalendarCheck },
  { id: "quadras", label: "Quadras", icon: Waves },
  { id: "modalidades", label: "Modalidades", icon: BarChart3 },
  { id: "horarios", label: "Horários", icon: Clock3 },
  { id: "clientes", label: "Clientes", icon: UsersRound },
  { id: "comunicados", label: "Comunicados", icon: Megaphone },
  { id: "relatorios", label: "Relatórios", icon: BarChart3 },
];

const pageTitles = {
  dashboard: {
    eyebrow: "Painel de operação",
    title: "Visão geral da arena",
    description: "Resumo visual das reservas, ocupação e alertas do dia.",
  },
  reservas: {
    eyebrow: "Gestão de reservas",
    title: "Reservas da arena",
    description: "Acompanhe solicitacoes, confirmacoes, cancelamentos e finalizacoes.",
  },
  quadras: {
    eyebrow: "Estrutura",
    title: "Quadras cadastradas",
    description: "Gerencie status, modalidades, valores e imagens das quadras.",
  },
  modalidades: {
    eyebrow: "Modalidades",
    title: "Modalidades cadastradas",
    description: "Gerencie esportes disponiveis, descricoes e status.",
  },
  horarios: {
    eyebrow: "Grade operacional",
    title: "Horários por quadra",
    description: "Visualize janelas livres, reservadas e bloqueadas.",
  },
  clientes: {
    eyebrow: "Relacionamento",
    title: "Clientes cadastrados",
    description: "Consulte histórico, contatos e situação dos jogadores.",
  },
  comunicados: {
    eyebrow: "Comunicação",
    title: "Comunicados e avisos",
    description: "Prepare promoções, avisos de manutenção e regras da arena.",
  },
  relatorios: {
    eyebrow: "Indicadores",
    title: "Relatórios básicos",
    description: "Dados reais para leitura rapida do desempenho da arena.",
  },
};

function routeToPath(route) {
  if (route === "login") return "/admin/login";
  if (route === "dashboard") return "/admin/dashboard";
  return `/admin/${route}`;
}

function statusReserva(status) {
  const labels = {
    pendente: "Pendente",
    confirmada: "Confirmada",
    cancelada: "Cancelada",
    finalizada: "Finalizada",
  };
  return labels[status] || status || "--";
}

function statusQuadra(status) {
  const labels = {
    ativa: "Ativa",
    manutencao: "Manutencao",
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

export function AdminPanel({ route = "dashboard" }) {
  const navigateRouter = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const currentRoute = pageTitles[route] ? route : "dashboard";

  const navigate = (nextRoute) => {
    setSidebarOpen(false);
    navigateRouter(routeToPath(nextRoute));
  };

  return (
    <AdminLayout
      currentRoute={currentRoute}
      sidebarOpen={sidebarOpen}
      onCloseSidebar={() => setSidebarOpen(false)}
      onNavigate={navigate}
      onOpenSidebar={() => setSidebarOpen(true)}
      onLogout={() => {
        logoutAdmin();
        navigateRouter("/admin/login", { replace: true });
      }}
    >
      <AdminScreen route={currentRoute} />
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
        <div className="admin-login__mark">
          <Waves aria-hidden="true" size={38} />
        </div>
        <span className="admin-login__eyebrow">Arena Onda Admin</span>
        <h1>Controle a areia sem perder o ritmo do jogo.</h1>
        <p>
          Painel para o gestor acompanhar reservas, quadras, clientes e
          comunicados com autenticacao real.
        </p>
        <div className="admin-login__security">
          <ShieldCheck aria-hidden="true" />
          <span>Ambiente administrativo protegido por token JWT.</span>
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
          <p className="admin-login__error" role="status">
            {error}
          </p>
        )}
        <button className="admin-button admin-button--primary" type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Entrando..." : "Entrar"}
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
  onOpenSidebar,
  sidebarOpen,
}) {
  const currentPage = pageTitles[currentRoute] || pageTitles.dashboard;

  return (
    <div className="admin-shell">
      <aside className={`admin-sidebar ${sidebarOpen ? "admin-sidebar--open" : ""}`}>
        <div className="admin-sidebar__top">
          <a className="admin-logo" href="/">
            <span>
              <Waves aria-hidden="true" />
            </span>
            <strong>ARENA ONDA</strong>
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
            <span>API conectada</span>
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
          <button className="admin-header__menu" type="button" onClick={onOpenSidebar}>
            <Menu aria-hidden="true" />
          </button>
          <div>
            <span>{currentPage.eyebrow}</span>
            <h1>{currentPage.title}</h1>
            <p>{currentPage.description}</p>
          </div>
          <div className="admin-header__actions">
            <SearchInput placeholder="Buscar no painel" />
            <button type="button" aria-label="Notificações">
              <Bell aria-hidden="true" size={19} />
              <i />
            </button>
            <button type="button" aria-label="Modo noturno visual">
              <Moon aria-hidden="true" size={19} />
            </button>
            <div className="admin-user">
              <span>PO</span>
              <strong>Pablo</strong>
            </div>
          </div>
        </header>
        {children}
      </div>
    </div>
  );
}

function AdminScreen({ route }) {
  const screens = {
    dashboard: <DashboardScreen />,
    reservas: <ReservationsScreen />,
    quadras: <CourtsScreen />,
    modalidades: <ModalitiesScreen />,
    horarios: <ScheduleScreen />,
    clientes: <ClientsScreen />,
    comunicados: <AnnouncementsScreen />,
    relatorios: <ReportsScreen />,
  };

  return screens[route] || screens.dashboard;
}

function DashboardScreen() {
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
        if (active) setError("Nao foi possivel carregar os dados do dashboard.");
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
          trend: "API real",
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
          label: "Clientes cadastrados",
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
  const pendingReservations = reservas.filter((item) => item.status === "pendente");

  return (
    <div className="admin-page">
      <AdminState
        error={error}
        isLoading={isLoading}
        loadingText="Carregando dashboard..."
      />
      <DashboardCards stats={stats} />

      <section className="admin-grid admin-grid--dashboard">
        <Panel title="Próximas reservas" action="Ver agenda">
          <div className="admin-reservation-list">
            {nextReservations.map((reservation) => (
              <ReservationSummary key={reservation.id} reservation={reservation} />
            ))}
          </div>
        </Panel>

        <Panel title="Reservas pendentes" action={`${pendingReservations.length} pendente`}>
          <div className="admin-pending-card">
            <AlertTriangle aria-hidden="true" size={24} />
            <strong>{pendingReservations.length} reserva aguardando confirmação</strong>
            <p>Revise pagamento, horário e dados do cliente antes de confirmar.</p>
            <AdminButton>Revisar pendências</AdminButton>
          </div>
        </Panel>
      </section>

      <section className="admin-grid admin-grid--two">
        <Panel title="Atalhos rápidos">
          <QuickActions />
        </Panel>
        <Panel title="Avisos importantes">
          <div className="admin-alerts">
            <p>
              <strong>Onda 03 em manutenção:</strong> bloquear manhã até troca
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

function QuickActions() {
  const actions = [
    "Nova reserva",
    "Cadastrar quadra",
    "Bloquear horário",
    "Criar comunicado",
    "Ver relatórios",
  ];

  return (
    <div className="admin-quick-actions">
      {actions.map((action) => (
        <button key={action} type="button">
          <Plus aria-hidden="true" size={17} />
          {action}
        </button>
      ))}
    </div>
  );
}

function ReservationsScreen() {
  const [reservas, setReservas] = useState([]);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [feedback, setFeedback] = useState("");

  const carregarReservas = async () => {
    setIsLoading(true);
    setError("");
    try {
      setReservas(await listarReservas());
    } catch {
      setError("Nao foi possivel carregar as reservas.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void Promise.resolve().then(carregarReservas);
  }, []);

  const executarAcao = async (acao, id) => {
    setFeedback("");
    setError("");
    try {
      await acao(id);
      setFeedback("Alteracao salva com sucesso.");
      await carregarReservas();
    } catch (requestError) {
      setError(requestError.message || "Nao foi possivel atualizar a reserva.");
    }
  };

  return (
    <div className="admin-page">
      <Toolbar title="Lista de reservas" buttonLabel="Nova reserva" />
      <Panel title="Reservas da API">
        <AdminState
          error={error}
          isLoading={isLoading}
          empty={!reservas.length}
          loadingText="Carregando reservas..."
          emptyText="Nenhuma reserva encontrada."
        />
        {feedback && <p className="admin-success">{feedback}</p>}
        {!isLoading && !error && reservas.length > 0 && (
          <ResponsiveTable columns={["Cliente", "Quadra", "Modalidade", "Data", "Horario", "Status", "Acoes"]}>
            {reservas.map((reservation) => (
              <tr key={reservation.id}>
                <td>
                  <strong>{reservation.cliente?.nome || "--"}</strong>
                  <small>{reservation.cliente?.telefone || "--"}</small>
                </td>
                <td>{reservation.quadra?.nome || "--"}</td>
                <td>{reservation.modalidade?.nome || "--"}</td>
                <td>{reservation.data}</td>
                <td>{String(reservation.horaInicio || "").slice(0, 5)}</td>
                <td>
                  <StatusBadge status={statusReserva(reservation.status)} />
                </td>
                <td>
                  <div className="admin-table-actions">
                    <button type="button" onClick={() => executarAcao(confirmarReserva, reservation.id)}>
                      <Check aria-hidden="true" size={15} />
                      <span>Confirmar</span>
                    </button>
                    <button type="button" onClick={() => executarAcao(cancelarReserva, reservation.id)}>
                      <X aria-hidden="true" size={15} />
                      <span>Cancelar</span>
                    </button>
                    <button type="button" onClick={() => executarAcao(finalizarReserva, reservation.id)}>
                      <Eye aria-hidden="true" size={15} />
                      <span>Finalizar</span>
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

function CourtsScreen() {
  const [courts, setCourts] = useState([]);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [feedback, setFeedback] = useState("");

  const carregarQuadras = async () => {
    setIsLoading(true);
    setError("");
    try {
      setCourts(await listarQuadras());
    } catch {
      setError("Nao foi possivel carregar as quadras.");
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
      setFeedback("Status da quadra atualizado.");
      await carregarQuadras();
    } catch (requestError) {
      setError(requestError.message || "Nao foi possivel atualizar a quadra.");
    }
  };

  return (
    <div className="admin-page">
      <Toolbar title="Quadras cadastradas" buttonLabel="Cadastrar nova quadra" />
      <AdminState
        error={error}
        isLoading={isLoading}
        empty={!courts.length}
        loadingText="Carregando quadras..."
        emptyText="Nenhuma quadra encontrada."
      />
      {feedback && <p className="admin-success">{feedback}</p>}
      {!isLoading && !error && courts.length > 0 && (
        <section className="admin-court-grid">
          {courts.map((court) => (
            <article className="admin-court-card" key={court.id}>
              <img src={court.imagemUrl || courtImages.onda1} alt={`Foto da ${court.nome}`} />
              <div>
                <span>C-{String(court.id).padStart(2, "0")}</span>
                <StatusBadge status={statusQuadra(court.status)} />
              </div>
              <h2>{court.nome}</h2>
              <p>{(court.modalidades || []).map((modalidade) => modalidade.nome).join(" | ") || court.descricao || "--"}</p>
              <footer>
                <strong>R$ {Number(court.valorHora || 0).toFixed(2).replace(".", ",")}</strong>
                <small>{court.descricao || "Sem descricao"}</small>
              </footer>
              <div className="admin-card-actions">
                <AdminButton variant="ghost" onClick={() => mudarStatus(court.id, "ativa")}>
                  Ativar
                </AdminButton>
                <AdminButton variant="ghost" onClick={() => mudarStatus(court.id, "manutencao")}>
                  Manutencao
                </AdminButton>
                <AdminButton onClick={() => mudarStatus(court.id, "inativa")}>
                  Inativar
                </AdminButton>
              </div>
            </article>
          ))}
        </section>
      )}
    </div>
  );
}

function ModalitiesScreen() {
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
      setError("Nao foi possivel carregar as modalidades.");
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
      setError(requestError.message || "Nao foi possivel atualizar a modalidade.");
    }
  };

  return (
    <div className="admin-page">
      <Toolbar title="Modalidades cadastradas" buttonLabel="Cadastrar modalidade" />
      <Panel title="Modalidades da API">
        <AdminState
          error={error}
          isLoading={isLoading}
          empty={!modalidades.length}
          loadingText="Carregando modalidades..."
          emptyText="Nenhuma modalidade encontrada."
        />
        {feedback && <p className="admin-success">{feedback}</p>}
        {!isLoading && !error && modalidades.length > 0 && (
          <ResponsiveTable columns={["Nome", "Descricao", "Status", "Acoes"]}>
            {modalidades.map((modalidade) => (
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
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [feedback, setFeedback] = useState("");

  const carregarHorarios = async () => {
    setIsLoading(true);
    setError("");
    try {
      setHorarios(await listarHorarios());
    } catch {
      setError("Nao foi possivel carregar os horarios.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void Promise.resolve().then(carregarHorarios);
  }, []);

  const executarAcao = async (acao, id) => {
    setFeedback("");
    setError("");
    try {
      await acao(id);
      setFeedback("Horario atualizado com sucesso.");
      await carregarHorarios();
    } catch (requestError) {
      setError(requestError.message || "Nao foi possivel atualizar o horario.");
    }
  };

  const porQuadra = horarios.reduce((acc, horario) => {
    const nome = horario.quadra?.nome || "Sem quadra";
    acc[nome] = acc[nome] || [];
    acc[nome].push(horario);
    return acc;
  }, {});

  return (
    <div className="admin-page">
      <Toolbar title="Grade de horarios" buttonLabel="Criar horario" />
      <Panel title="Mapa operacional por quadra">
        <AdminState
          error={error}
          isLoading={isLoading}
          empty={!horarios.length}
          loadingText="Carregando horarios..."
          emptyText="Nenhum horario encontrado."
        />
        {feedback && <p className="admin-success">{feedback}</p>}
        {!isLoading && !error && Object.entries(porQuadra).map(([court, slots]) => (
          <div className="admin-schedule__row" key={court}>
            <strong>{court}</strong>
            <div>
              {slots.map((slot) => (
                <button
                  className={`admin-slot admin-slot--${statusHorario(slot.status).toLowerCase()}`}
                  key={slot.id}
                  type="button"
                  onClick={() =>
                    slot.status === "bloqueado"
                      ? executarAcao(liberarHorario, slot.id)
                      : executarAcao(bloquearHorario, slot.id)
                  }
                >
                  <span>{String(slot.horaInicio || "").slice(0, 5)}</span>
                  <small>{statusHorario(slot.status)}</small>
                </button>
              ))}
            </div>
          </div>
        ))}
      </Panel>
    </div>
  );
}

function ClientsScreen() {
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
      setError("Nao foi possivel carregar os clientes.");
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
      setError(requestError.message || "Nao foi possivel atualizar o cliente.");
    }
  };

  return (
    <div className="admin-page">
      <Toolbar title="Clientes cadastrados" buttonLabel="Novo cliente" />
      <Panel title="Base de clientes">
        <AdminState
          error={error}
          isLoading={isLoading}
          empty={!clientes.length}
          loadingText="Carregando clientes..."
          emptyText="Nenhum cliente encontrado."
        />
        {feedback && <p className="admin-success">{feedback}</p>}
        {!isLoading && !error && clientes.length > 0 && (
          <ResponsiveTable columns={["Nome", "Telefone", "E-mail", "Status", "Acoes"]}>
            {clientes.map((client) => (
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

function AnnouncementsScreen() {
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
      setError("Nao foi possivel carregar os comunicados.");
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
      setError(requestError.message || "Nao foi possivel atualizar o comunicado.");
    }
  };

  return (
    <div className="admin-page">
      <Toolbar title="Comunicados da arena" buttonLabel="Novo comunicado" />
      <section className="admin-grid admin-grid--two">
        <Panel title="Lista de comunicados">
          <AdminState
            error={error}
            isLoading={isLoading}
            empty={!comunicados.length}
            loadingText="Carregando comunicados..."
            emptyText="Nenhum comunicado encontrado."
          />
          {feedback && <p className="admin-success">{feedback}</p>}
          {!isLoading && !error && comunicados.length > 0 && (
            <div className="admin-announcements">
              {comunicados.map((announcement) => (
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
      </section>
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
        const [reservas, ocupacao, modalidades] = await Promise.all([
          buscarRelatorioReservas(),
          buscarRelatorioOcupacao(),
          buscarRelatorioModalidades(),
        ]);
        if (active) setReports({ reservas, ocupacao, modalidades });
      } catch {
        if (active) setError("Nao foi possivel carregar os relatorios.");
      } finally {
        if (active) setIsLoading(false);
      }
    }

    carregarRelatorios();

    return () => {
      active = false;
    };
  }, []);

  const reservasPorStatus = reports?.reservas?.agrupadasPorStatus?.map((item) => ({
    label: statusReserva(item.status),
    value: Number(item.total),
  })) || [];

  const modalidades = reports?.modalidades?.modalidades?.map((item) => ({
    label: item.nome,
    value: Number(item.totalReservas || 0),
  })) || [];

  const highlights = reports
    ? [
        { label: "Total de reservas", value: reports.reservas.total },
        { label: "Total horarios", value: reports.ocupacao.totalHorarios },
        { label: "Horarios reservados", value: reports.ocupacao.horariosReservados },
        { label: "Ocupacao media", value: `${reports.ocupacao.taxaOcupacao}%` },
      ]
    : [];

  return (
    <div className="admin-page">
      <Toolbar title="Relatorios da API" buttonLabel="Exportar visual" />
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
          <article className="admin-stat admin-stat--sand" key={item.label}>
            <span>{item.label}</span>
            <strong>{item.value}</strong>
            <small>API real</small>
          </article>
        ))}
      </section>
    </div>
  );
}

function Panel({ action, children, title }) {
  return (
    <section className="admin-panel">
      <header>
        <h2>{title}</h2>
        {action && <button type="button">{action}</button>}
      </header>
      {children}
    </section>
  );
}

function Toolbar({ buttonLabel, title }) {
  return (
    <div className="admin-toolbar">
      <div>
        <h2>{title}</h2>
        <p>Dados carregados da API quando o backend estiver disponivel.</p>
      </div>
      <div>
        <SearchInput placeholder="Pesquisar" />
        <button className="admin-filter" type="button">
          <Filter aria-hidden="true" size={17} />
          Filtros
        </button>
        <AdminButton>
          <Plus aria-hidden="true" size={17} />
          {buttonLabel}
        </AdminButton>
      </div>
    </div>
  );
}

function SearchInput({ placeholder }) {
  return (
    <label className="admin-search">
      <Search aria-hidden="true" size={17} />
      <input type="search" placeholder={placeholder} />
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

function ResponsiveTable({ children, columns }) {
  return (
    <div className="admin-table-wrap">
      <table className="admin-table">
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
