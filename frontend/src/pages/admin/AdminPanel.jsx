import { useMemo, useState } from "react";
import {
  AlertTriangle,
  Archive,
  BarChart3,
  Bell,
  CalendarCheck,
  Check,
  ChevronRight,
  Clock3,
  Edit3,
  Eye,
  FileImage,
  Filter,
  ImageUp,
  LayoutDashboard,
  LockKeyhole,
  LogOut,
  Mail,
  Megaphone,
  Menu,
  Moon,
  MoreHorizontal,
  Plus,
  Search,
  Settings,
  ShieldCheck,
  Trash2,
  UsersRound,
  Waves,
  X,
} from "lucide-react";
import {
  adminAnnouncements,
  adminClients,
  adminCourts,
  adminFiles,
  adminReports,
  adminReservations,
  adminSchedule,
  adminStats,
} from "../../constants/adminMockData";

const navItems = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "reservas", label: "Reservas", icon: CalendarCheck },
  { id: "quadras", label: "Quadras", icon: Waves },
  { id: "horarios", label: "Horários", icon: Clock3 },
  { id: "clientes", label: "Clientes", icon: UsersRound },
  { id: "comunicados", label: "Comunicados", icon: Megaphone },
  { id: "arquivos", label: "Arquivos", icon: Archive },
  { id: "relatorios", label: "Relatórios", icon: BarChart3 },
  { id: "configuracoes", label: "Configurações", icon: Settings },
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
    description: "Acompanhe solicitações, confirmações e cancelamentos simulados.",
  },
  quadras: {
    eyebrow: "Estrutura",
    title: "Quadras cadastradas",
    description: "Gerencie status, modalidades, valores e imagens das quadras.",
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
  arquivos: {
    eyebrow: "Biblioteca",
    title: "Arquivos e imagens",
    description: "Organize fotos das quadras, documentos e vídeos simulados.",
  },
  relatorios: {
    eyebrow: "Indicadores",
    title: "Relatórios básicos",
    description: "Dados simulados para leitura rápida do desempenho da arena.",
  },
  configuracoes: {
    eyebrow: "Preferências",
    title: "Configurações visuais",
    description: "Prévia de ajustes futuros de operação, agenda e notificações.",
  },
};

function normalizeRoute(pathname) {
  const route = pathname.replace(/^\/admin\/?/, "").split("/")[0];
  if (!route || route === "admin") return "dashboard";
  if (route === "login") return "login";
  return pageTitles[route] ? route : "dashboard";
}

function routeToPath(route) {
  if (route === "login") return "/admin/login";
  if (route === "dashboard") return "/admin/dashboard";
  return `/admin/${route}`;
}

export function AdminPanel() {
  const [route, setRoute] = useState(() => normalizeRoute(window.location.pathname));
  const [isLoggedIn, setIsLoggedIn] = useState(route !== "login");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const navigate = (nextRoute) => {
    setRoute(nextRoute);
    setSidebarOpen(false);
    window.history.pushState({}, "", routeToPath(nextRoute));
  };

  if (route === "login" || !isLoggedIn) {
    return (
      <AdminLogin
        onEnter={() => {
          setIsLoggedIn(true);
          navigate("dashboard");
        }}
      />
    );
  }

  return (
    <AdminLayout
      currentRoute={route}
      sidebarOpen={sidebarOpen}
      onCloseSidebar={() => setSidebarOpen(false)}
      onNavigate={navigate}
      onOpenSidebar={() => setSidebarOpen(true)}
      onLogout={() => {
        setIsLoggedIn(false);
        navigate("login");
      }}
    >
      <AdminScreen route={route} />
    </AdminLayout>
  );
}

function AdminLogin({ onEnter }) {
  const [showError, setShowError] = useState(false);

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
          Tela visual para o gestor acompanhar reservas, quadras, clientes e
          comunicados. A autenticação real entra em uma etapa futura.
        </p>
        <div className="admin-login__security">
          <ShieldCheck aria-hidden="true" />
          <span>Ambiente administrativo simulado, sem envio de credenciais.</span>
        </div>
      </section>

      <section className="admin-login__card" aria-label="Login administrativo">
        <span className="admin-login__card-kicker">Acesso do gestor</span>
        <h2>Entrar no painel</h2>
        <label>
          E-mail
          <div>
            <Mail aria-hidden="true" size={18} />
            <input type="email" placeholder="gestor@arenaonda.com" />
          </div>
        </label>
        <label>
          Senha
          <div>
            <LockKeyhole aria-hidden="true" size={18} />
            <input type="password" placeholder="••••••••" />
          </div>
        </label>
        {showError && (
          <p className="admin-login__error" role="status">
            Este erro é apenas visual. Clique em entrar para acessar a
            demonstração.
          </p>
        )}
        <button className="admin-button admin-button--primary" type="button" onClick={onEnter}>
          Entrar
          <ChevronRight aria-hidden="true" size={18} />
        </button>
        <button className="admin-login__ghost" type="button" onClick={() => setShowError(true)}>
          Simular mensagem de erro
        </button>
      </section>
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
            <span>Plano visual</span>
            <strong>Parte 2 • Mockado</strong>
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
    horarios: <ScheduleScreen />,
    clientes: <ClientsScreen />,
    comunicados: <AnnouncementsScreen />,
    arquivos: <FilesScreen />,
    relatorios: <ReportsScreen />,
    configuracoes: <SettingsScreen />,
  };

  return screens[route] || screens.dashboard;
}

function DashboardScreen() {
  const nextReservations = adminReservations.slice(0, 3);
  const pendingReservations = adminReservations.filter((item) => item.status === "Pendente");

  return (
    <div className="admin-page">
      <DashboardCards />

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

function DashboardCards() {
  return (
    <section className="admin-stats">
      {adminStats.map((stat) => (
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
  return (
    <div className="admin-page">
      <Toolbar title="Lista de reservas" buttonLabel="Nova reserva" />
      <Panel title="Reservas simuladas">
        <ResponsiveTable
          columns={["Cliente", "Quadra", "Modalidade", "Data", "Horário", "Status", "Ações"]}
        >
          {adminReservations.map((reservation) => (
            <tr key={reservation.id}>
              <td>
                <strong>{reservation.customer}</strong>
                <small>{reservation.phone}</small>
              </td>
              <td>{reservation.court}</td>
              <td>{reservation.modality}</td>
              <td>{reservation.date}</td>
              <td>{reservation.time}</td>
              <td>
                <StatusBadge status={reservation.status} />
              </td>
              <td>
                <TableActions actions={["Confirmar", "Cancelar", "Editar", "Detalhes"]} />
              </td>
            </tr>
          ))}
        </ResponsiveTable>
      </Panel>
    </div>
  );
}

function CourtsScreen() {
  return (
    <div className="admin-page">
      <Toolbar title="Quadras cadastradas" buttonLabel="Cadastrar nova quadra" />
      <section className="admin-court-grid">
        {adminCourts.map((court) => (
          <article className="admin-court-card" key={court.id}>
            <img src={court.image} alt={`Foto da ${court.name}`} />
            <div>
              <span>{court.id}</span>
              <StatusBadge status={court.status} />
            </div>
            <h2>{court.name}</h2>
            <p>{court.modalities.join(" • ")}</p>
            <footer>
              <strong>{court.price}</strong>
              <small>Manutenção: {court.nextMaintenance}</small>
            </footer>
            <div className="admin-card-actions">
              <AdminButton variant="ghost">Editar</AdminButton>
              <AdminButton variant="ghost">Ativar/desativar</AdminButton>
              <AdminButton>Ver horários</AdminButton>
            </div>
          </article>
        ))}
      </section>
      <QuadraForm />
    </div>
  );
}

function QuadraForm() {
  return (
    <Panel title="Formulário visual de quadra">
      <form className="admin-form">
        <label>
          Nome da quadra
          <input type="text" placeholder="Ex: Onda 04" />
        </label>
        <label>
          Modalidades permitidas
          <select defaultValue="Beach Tennis, Futevôlei">
            <option>Beach Tennis, Futevôlei</option>
            <option>Vôlei de Areia</option>
            <option>Todas as modalidades</option>
          </select>
        </label>
        <label>
          Valor por horário
          <input type="text" placeholder="R$ 90,00" />
        </label>
        <label>
          Status
          <select defaultValue="Ativa">
            <option>Ativa</option>
            <option>Ocupada</option>
            <option>Manutenção</option>
            <option>Inativa</option>
          </select>
        </label>
        <div className="admin-upload-box">
          <ImageUp aria-hidden="true" />
          <strong>Upload visual de imagem</strong>
          <span>JPG, PNG ou WEBP. Simulado nesta etapa.</span>
        </div>
        <AdminButton>Salvar visualmente</AdminButton>
      </form>
    </Panel>
  );
}

function ScheduleScreen() {
  return (
    <div className="admin-page">
      <Toolbar title="Grade de horários" buttonLabel="Bloquear horário" />
      <Panel title="Mapa operacional por quadra">
        <div className="admin-schedule">
          {adminSchedule.map((court) => (
            <div className="admin-schedule__row" key={court.court}>
              <strong>{court.court}</strong>
              <div>
                {court.slots.map((slot) => (
                  <button
                    className={`admin-slot admin-slot--${slot.status.toLowerCase()}`}
                    key={`${court.court}-${slot.time}`}
                    type="button"
                  >
                    <span>{slot.time}</span>
                    <small>{slot.status}</small>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </Panel>
      <section className="admin-grid admin-grid--three">
        <Panel title="Livre">
          <p className="admin-muted">Horários prontos para reserva online.</p>
          <AdminButton variant="ghost">Liberar horário</AdminButton>
        </Panel>
        <Panel title="Reservado">
          <p className="admin-muted">Horários com reserva vinculada.</p>
          <AdminButton variant="ghost">Ver reserva</AdminButton>
        </Panel>
        <Panel title="Bloqueado">
          <p className="admin-muted">Manutenção, evento ou pausa operacional.</p>
          <AdminButton variant="ghost">Bloquear horário</AdminButton>
        </Panel>
      </section>
    </div>
  );
}

function ClientsScreen() {
  return (
    <div className="admin-page">
      <Toolbar title="Clientes cadastrados" buttonLabel="Novo cliente" />
      <Panel title="Base de clientes">
        <ResponsiveTable columns={["Nome", "Telefone", "E-mail", "Reservas", "Última", "Status", "Ações"]}>
          {adminClients.map((client) => (
            <tr key={client.id}>
              <td>
                <strong>{client.name}</strong>
                <small>{client.id}</small>
              </td>
              <td>{client.phone}</td>
              <td>{client.email}</td>
              <td>{client.reservations}</td>
              <td>{client.lastReservation}</td>
              <td>
                <StatusBadge status={client.status} />
              </td>
              <td>
                <TableActions actions={["Detalhes", "Histórico", "Editar", "Desativar"]} />
              </td>
            </tr>
          ))}
        </ResponsiveTable>
      </Panel>
    </div>
  );
}

function AnnouncementsScreen() {
  return (
    <div className="admin-page">
      <Toolbar title="Comunicados da arena" buttonLabel="Novo comunicado" />
      <section className="admin-grid admin-grid--two">
        <Panel title="Lista de comunicados">
          <div className="admin-announcements">
            {adminAnnouncements.map((announcement) => (
              <article key={announcement.id}>
                <div>
                  <StatusBadge status={announcement.status} />
                  {announcement.highlighted && <span className="admin-highlight">Destaque</span>}
                </div>
                <h3>{announcement.title}</h3>
                <p>{announcement.message}</p>
                <TableActions actions={["Editar", "Excluir", "Publicar"]} />
              </article>
            ))}
          </div>
        </Panel>
        <Panel title="Formulário visual">
          <form className="admin-form admin-form--stack">
            <label>
              Título
              <input type="text" placeholder="Título do comunicado" />
            </label>
            <label>
              Mensagem
              <textarea placeholder="Escreva o aviso para os clientes" rows="7" />
            </label>
            <label className="admin-check">
              <input type="checkbox" />
              Destacar comunicado no site
            </label>
            <AdminButton>Publicar visualmente</AdminButton>
          </form>
        </Panel>
      </section>
    </div>
  );
}

function FilesScreen() {
  return (
    <div className="admin-page">
      <Toolbar title="Biblioteca de arquivos" buttonLabel="Enviar arquivo" />
      <section className="admin-files-grid">
        <article className="admin-upload-card">
          <ImageUp aria-hidden="true" size={34} />
          <strong>Upload visual</strong>
          <p>Simule envio de imagens, documentos ou vídeos da arena.</p>
          <AdminButton>Selecionar arquivo</AdminButton>
        </article>
        {adminFiles.map((file) => (
          <article className="admin-file-card" key={file.id}>
            {file.preview ? (
              <img src={file.preview} alt={`Prévia de ${file.name}`} />
            ) : (
              <div>
                <FileImage aria-hidden="true" size={38} />
              </div>
            )}
            <span>{file.type}</span>
            <h3>{file.name}</h3>
            <p>Enviado em {file.uploadedAt}</p>
            <TableActions actions={["Visualizar", "Editar", "Remover"]} />
          </article>
        ))}
      </section>
    </div>
  );
}

function ReportsScreen() {
  return (
    <div className="admin-page">
      <Toolbar title="Relatórios simulados" buttonLabel="Exportar visual" />
      <section className="admin-grid admin-grid--two">
        <Panel title="Reservas por dia">
          <SimpleChart items={adminReports.reservationsByDay} />
        </Panel>
        <Panel title="Reservas por modalidade">
          <div className="admin-report-bars">
            {adminReports.modalities.map((item) => (
              <div key={item.label}>
                <span>
                  {item.label}
                  <strong>{item.value}%</strong>
                </span>
                <i style={{ width: `${item.value}%` }} />
              </div>
            ))}
          </div>
        </Panel>
      </section>
      <section className="admin-stats admin-stats--reports">
        {adminReports.highlights.map((item) => (
          <article className="admin-stat admin-stat--sand" key={item.label}>
            <span>{item.label}</span>
            <strong>{item.value}</strong>
            <small>período atual</small>
          </article>
        ))}
      </section>
    </div>
  );
}

function SettingsScreen() {
  return (
    <div className="admin-page">
      <Panel title="Configurações futuras">
        <div className="admin-settings-grid">
          {[
            "Dados da arena",
            "Regras de cancelamento",
            "Horário de funcionamento",
            "Notificações por WhatsApp",
            "Permissões de equipe",
            "Integração com API REST",
          ].map((item) => (
            <button key={item} type="button">
              <Settings aria-hidden="true" size={18} />
              {item}
              <ChevronRight aria-hidden="true" size={16} />
            </button>
          ))}
        </div>
      </Panel>
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
        <p>Dados simulados para aprovação visual antes da API.</p>
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

function AdminButton({ children, variant = "primary" }) {
  return (
    <button className={`admin-button admin-button--${variant}`} type="button">
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

function TableActions({ actions }) {
  const icons = [Check, X, Edit3, Eye, Trash2, MoreHorizontal];

  return (
    <div className="admin-table-actions">
      {actions.map((action, index) => {
        const Icon = icons[index] || MoreHorizontal;
        return (
          <button key={action} type="button" title={action}>
            <Icon aria-hidden="true" size={15} />
            <span>{action}</span>
          </button>
        );
      })}
    </div>
  );
}

function SimpleChart({ items }) {
  const maxValue = useMemo(
    () => Math.max(...items.map((item) => item.value)),
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

