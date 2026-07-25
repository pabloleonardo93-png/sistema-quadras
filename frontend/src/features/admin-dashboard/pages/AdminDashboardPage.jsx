import { useEffect, useState } from "react";
import { CalendarCheck, CircleDollarSign, ClipboardList, Percent } from "lucide-react";
import DashboardStats from "../../../components/admin/DashboardStats";
import LoadingSkeleton from "../../../components/admin/LoadingSkeleton";
import OccupancyChart from "../../../components/admin/OccupancyChart";
import PaymentSummary from "../../../components/admin/PaymentSummary";
import QuickSummary from "../../../components/admin/QuickSummary";
import UpcomingReservations from "../../../components/admin/UpcomingReservations";
import { listarHorarios } from "../../../services/horarioService";
import { listarQuadrasAdmin } from "../../../services/quadraService";
import { buscarDashboard } from "../../../services/relatorioService";
import { listarReservas } from "../../../services/reservaService";
import { PAGAMENTO_STATUS } from "../../../shared/constants/pagamentoStatus";
import { RESERVA_STATUS, labelReservaStatus } from "../../../shared/constants/reservaStatus";
import { QUADRA_STATUS } from "../../../shared/constants/adminStatus";
import AdminPageShell from "../../admin-shared/components/AdminPageShell";
import {
  calcularOcupacaoHorarios,
  estaNaSemanaAtual,
  estaNoMesAtual,
  formatarDataAdmin,
  formatarDataISOAdmin,
  formatarDataReservaAdmin,
  formatarHoraAdmin,
  formatarMoedaAdmin,
  montarOcupacaoPorHorario,
  obterDataHoraReserva,
  obterIniciais,
  obterTipoPiso,
} from "../../admin-shared/utils/adminFormatters";

export default function AdminDashboardPage() {
  return (
    <AdminPageShell route="dashboard">
      {({ onNavigate }) => <DashboardScreen onNavigate={onNavigate} />}
    </AdminPageShell>
  );
}

function DashboardScreen({ onNavigate }) {
  const [dashboard, setDashboard] = useState(null);
  const [reservas, setReservas] = useState([]);
  const [horarios, setHorarios] = useState([]);
  const [quadras, setQuadras] = useState([]);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let active = true;

    async function carregarDashboard() {
      setError("");
      const [dashboardResult, reservasResult, horariosResult, quadrasResult] = await Promise.allSettled([
        buscarDashboard(),
        listarReservas(),
        listarHorarios(),
        listarQuadrasAdmin(),
      ]);

      if (!active) return;

      if (dashboardResult.status === "fulfilled") setDashboard(dashboardResult.value);
      if (reservasResult.status === "fulfilled") setReservas(reservasResult.value);
      if (horariosResult.status === "fulfilled") setHorarios(horariosResult.value);
      if (quadrasResult.status === "fulfilled") setQuadras(quadrasResult.value);

      if (dashboardResult.status === "rejected" && reservasResult.status === "rejected") {
        setError("Não foi possível carregar os dados do dashboard.");
      }

      setIsLoading(false);
    }

    carregarDashboard();

    return () => {
      active = false;
    };
  }, []);

  const hoje = formatarDataISOAdmin();
  const horariosHoje = horarios.filter((horario) => horario.data === hoje);
  const horariosSemana = horarios.filter((horario) => estaNaSemanaAtual(horario.data));
  const reservasHoje = reservas.filter((reserva) => reserva.data === hoje);
  const reservasSemana = reservas.filter((reserva) => estaNaSemanaAtual(reserva.data));
  const reservasAprovadasHoje = reservasHoje.filter((reserva) => reserva.pagamentoStatus === PAGAMENTO_STATUS.APROVADO);
  const reservasAprovadasMes = reservas.filter(
    (reserva) => reserva.pagamentoStatus === PAGAMENTO_STATUS.APROVADO && estaNoMesAtual(reserva.pagoEm || reserva.data),
  );
  const receitaHoje = reservasAprovadasHoje.reduce((total, reserva) => total + Number(reserva.valorTotal || 0), 0);
  const receitaMes = reservasAprovadasMes.reduce((total, reserva) => total + Number(reserva.valorTotal || 0), 0);
  const pendingReservationsReais = reservas.filter(
    (item) => item.status === RESERVA_STATUS.AGUARDANDO_PAGAMENTO || item.pagamentoStatus === PAGAMENTO_STATUS.PENDENTE,
  );
  const quadrasEmManutencao = quadras.filter((quadra) => quadra.status === QUADRA_STATUS.MANUTENCAO);
  const ocupacaoHoje = calcularOcupacaoHorarios(horariosHoje);
  const ocupacaoSemana = calcularOcupacaoHorarios(horariosSemana);
  const ocupacaoPorHorario = montarOcupacaoPorHorario(horariosHoje);

  const dashboardStats = [
    {
      icon: CalendarCheck,
      id: "reservas-hoje",
      secondary: `${dashboard?.reservasHoje ?? reservasHoje.length} no total do dia`,
      title: "Reservas hoje",
      tone: "blue",
      value: dashboard?.reservasHoje ?? reservasHoje.length,
    },
    {
      icon: Percent,
      id: "ocupacao-hoje",
      secondary: ocupacaoHoje.total
        ? `${ocupacaoHoje.reserved}/${ocupacaoHoje.total} horários reservados`
        : "Sem horários cadastrados hoje",
      title: "Ocupação hoje",
      tone: "orange",
      value: ocupacaoHoje.percent === null ? "--" : `${ocupacaoHoje.percent}%`,
    },
    {
      icon: CircleDollarSign,
      id: "receita-hoje",
      secondary: reservasAprovadasHoje.length
        ? `${reservasAprovadasHoje.length} pagamento${reservasAprovadasHoje.length > 1 ? "s" : ""} aprovado${reservasAprovadasHoje.length > 1 ? "s" : ""}`
        : "Nenhum pagamento aprovado hoje",
      title: "Receita hoje",
      tone: "green",
      value: formatarMoedaAdmin(receitaHoje),
    },
    {
      icon: ClipboardList,
      id: "pendencias",
      secondary: pendingReservationsReais.length ? "Pagamentos aguardando retorno" : "Sem pendências de pagamento",
      title: "Pendências",
      tone: "purple",
      value: pendingReservationsReais.length,
    },
  ];

  const upcomingReservations = reservas
    .map((reserva) => ({ reserva, dataHora: obterDataHoraReserva(reserva) }))
    .filter((item) => item.dataHora && item.dataHora >= new Date())
    .sort((a, b) => a.dataHora - b.dataHora)
    .slice(0, 4)
    .map(({ reserva }) => {
      const data = formatarDataReservaAdmin(reserva.data);
      const dataCurta = formatarDataAdmin(reserva.data).slice(0, 5);
      const nomeCliente = reserva.cliente?.nome || "--";

      return {
        clientName: nomeCliente,
        court: reserva.quadra?.nome || "--",
        date: `${data.weekday}, ${dataCurta}`,
        floorType: obterTipoPiso(reserva),
        id: reserva.id,
        initials: obterIniciais(nomeCliente),
        modality: reserva.modalidade?.nome || "--",
        statusLabel: labelReservaStatus(reserva.status),
        time: formatarHoraAdmin(reserva.horaInicio),
      };
    });

  const quickSummaryItems = [
    {
      description: `${dashboard?.reservasSemana ?? reservasSemana.length} na semana atual`,
      icon: "reservations",
      id: "reservas-semana",
      route: "reservas",
      title: "Reservas da semana",
    },
    {
      description: ocupacaoSemana.total
        ? `${ocupacaoSemana.percent}% (${ocupacaoSemana.reserved}/${ocupacaoSemana.total} horários)`
        : "Sem horários cadastrados na semana",
      icon: "occupancy",
      id: "ocupacao-semana",
      route: "horarios",
      title: "Ocupação da semana",
    },
    {
      description: `${pendingReservationsReais.length} pagamento${pendingReservationsReais.length === 1 ? "" : "s"} pendente${pendingReservationsReais.length === 1 ? "" : "s"}; ${quadrasEmManutencao.length} quadra${quadrasEmManutencao.length === 1 ? "" : "s"} em manutenção`,
      icon: "pending",
      id: "pendencias-operacionais",
      route: pendingReservationsReais.length ? "reservas" : "quadras",
      title: "Pendências operacionais",
    },
  ];

  return (
    <div className="admin-page admin-page--dashboard">
      {error && <p className="admin-error">{error}</p>}
      {isLoading ? (
        <LoadingSkeleton blocks={6} className="admin-loading-skeleton--dashboard" />
      ) : (
        <>
          <DashboardStats stats={dashboardStats} />

          <section className="admin-dashboard-grid">
            <div className="admin-dashboard-grid__main">
              <UpcomingReservations
                reservations={upcomingReservations}
                onOpenAgenda={() => onNavigate?.("horarios")}
                onOpenReservations={() => onNavigate?.("reservas")}
              />
              <OccupancyChart data={ocupacaoPorHorario} />
            </div>

            <aside className="admin-dashboard-grid__side">
              <PaymentSummary
                approvedPaymentsLabel={reservasAprovadasMes.length}
                monthlyRevenueLabel={formatarMoedaAdmin(receitaMes)}
                pendingCount={pendingReservationsReais.length}
                onOpenReservations={() => onNavigate?.("reservas")}
              />
              <QuickSummary items={quickSummaryItems} onNavigate={onNavigate} />
            </aside>
          </section>
        </>
      )}
    </div>
  );
}
