import { useEffect, useMemo, useState } from "react";
import { Ban, CalendarCheck, Check, Clock3 } from "lucide-react";
import EmptyState from "../../../components/admin/EmptyState";
import { FilterField } from "../../../components/admin/FilterBar";
import FilterBar from "../../../components/admin/FilterBar";
import LoadingSkeleton from "../../../components/admin/LoadingSkeleton";
import MetricCard from "../../../components/admin/MetricCard";
import Pagination from "../../../components/admin/Pagination";
import ReportChartCard from "../../../components/admin/ReportChartCard";
import ReservationTable from "../../../components/admin/ReservationTable";
import { listarModalidades } from "../../../services/modalidadeService";
import { listarQuadrasAdmin } from "../../../services/quadraService";
import { cancelarReserva, confirmarReserva, finalizarReserva, listarReservas } from "../../../services/reservaService";
import { PAGAMENTO_STATUS, labelPagamentoStatus, labelPagamentoStatusPainel } from "../../../shared/constants/pagamentoStatus";
import { RESERVA_STATUS, RESERVA_STATUS_FILTRO_ADMIN, labelReservaStatus } from "../../../shared/constants/reservaStatus";
import AdminPageShell from "../../admin-shared/components/AdminPageShell";
import { AdminState } from "../../admin-shared/components/AdminState";
import {
  calcularResumoStatus,
  formatarDataAdmin,
  formatarDataISOAdmin,
  formatarDataReservaAdmin,
  formatarHoraAdmin,
  formatarMoedaAdmin,
  normalizarBusca,
  porcentagem,
  reservaDentroPeriodo,
} from "../../admin-shared/utils/adminFormatters";

export default function AdminReservasPage() {
  return (
    <AdminPageShell route="reservas">
      {({ searchQuery }) => <ReservationsScreen searchQuery={searchQuery} />}
    </AdminPageShell>
  );
}

function ReservationsScreen({ searchQuery = "" }) {
  const [reservas, setReservas] = useState([]);
  const [quadras, setQuadras] = useState([]);
  const [modalidades, setModalidades] = useState([]);
  const [filtros, setFiltros] = useState({
    status: "",
    modalidadeId: "",
    quadraId: "",
    pagamentoStatus: "",
    periodo: "30d",
  });
  const [page, setPage] = useState(1);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [feedback, setFeedback] = useState("");
  const [savingAction, setSavingAction] = useState("");

  const carregarReservas = async () => {
    setIsLoading(true);
    setError("");
    try {
      const [reservasData, quadrasData, modalidadesData] = await Promise.all([
        listarReservas(),
        listarQuadrasAdmin(),
        listarModalidades(),
      ]);
      setReservas(reservasData);
      setQuadras(quadrasData);
      setModalidades(modalidadesData);
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
    return reservas.filter((reservation) => {
      const quadraId = String(reservation.quadraId || reservation.quadra?.id || "");
      const modalidadeId = String(reservation.modalidadeId || reservation.modalidade?.id || "");
      const pagamentoStatus = reservation.pagamentoStatus || "";

      if (filtros.status && reservation.status !== filtros.status) return false;
      if (filtros.quadraId && quadraId !== filtros.quadraId) return false;
      if (filtros.modalidadeId && modalidadeId !== filtros.modalidadeId) return false;
      if (filtros.pagamentoStatus && pagamentoStatus !== filtros.pagamentoStatus) return false;
      if (!reservaDentroPeriodo(reservation, filtros.periodo)) return false;
      if (!termo) return true;

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
        labelReservaStatus(reservation.status),
        labelPagamentoStatus(reservation.pagamentoStatus),
      ];
      return valores.some((valor) => normalizarBusca(valor).includes(termo));
    });
  }, [filtros, reservas, searchQuery]);

  const resumo = useMemo(() => calcularResumoStatus(reservasFiltradas), [reservasFiltradas]);
  const hoje = formatarDataISOAdmin();
  const reservasHoje = reservasFiltradas.filter((reserva) => reserva.data === hoje).length;
  const pageSize = 8;
  const pageCount = Math.max(1, Math.ceil(reservasFiltradas.length / pageSize));
  const paginaAtual = Math.min(page, pageCount);
  const reservasPaginadas = reservasFiltradas.slice((paginaAtual - 1) * pageSize, paginaAtual * pageSize);
  const paginationStart = reservasFiltradas.length ? (paginaAtual - 1) * pageSize + 1 : 0;
  const paginationEnd = Math.min(paginaAtual * pageSize, reservasFiltradas.length);
  const conversionRate = porcentagem(
    resumo[RESERVA_STATUS.CONFIRMADA] + resumo[RESERVA_STATUS.FINALIZADA],
    resumo.total,
  );

  const atualizarFiltro = (campo, valor) => {
    setPage(1);
    setFiltros((current) => ({ ...current, [campo]: valor }));
  };

  const limparFiltros = () => {
    setPage(1);
    setFiltros({
      status: "",
      modalidadeId: "",
      quadraId: "",
      pagamentoStatus: "",
      periodo: "30d",
    });
  };

  const acoesReserva = (reservation) => [
    {
      acao: confirmarReserva,
      enabled: reservation.status === RESERVA_STATUS.AGUARDANDO_PAGAMENTO && reservation.pagamentoStatus === PAGAMENTO_STATUS.APROVADO,
      id: "confirmar",
      label: "Confirmar",
      successMessage: "Reserva confirmada com sucesso.",
    },
    {
      acao: cancelarReserva,
      enabled: [RESERVA_STATUS.AGUARDANDO_PAGAMENTO, RESERVA_STATUS.CONFIRMADA].includes(reservation.status),
      id: "cancelar",
      label: "Cancelar",
      successMessage: "Reserva cancelada com sucesso.",
    },
    {
      acao: finalizarReserva,
      enabled: reservation.status === RESERVA_STATUS.CONFIRMADA,
      id: "finalizar",
      label: "Finalizar",
      successMessage: "Reserva finalizada com sucesso.",
    },
  ].filter((action) => action.enabled);

  return (
    <div className="admin-page admin-page--reservations">
      <FilterBar onClear={limparFiltros}>
        <FilterField label="Status">
          <select value={filtros.status} onChange={(event) => atualizarFiltro("status", event.target.value)}>
            <option value="">Todos</option>
            <option value={RESERVA_STATUS.CONFIRMADA}>{labelReservaStatus(RESERVA_STATUS.CONFIRMADA)}</option>
            <option value={RESERVA_STATUS.AGUARDANDO_PAGAMENTO}>{labelReservaStatus(RESERVA_STATUS.AGUARDANDO_PAGAMENTO)}</option>
            <option value={RESERVA_STATUS.FINALIZADA}>{labelReservaStatus(RESERVA_STATUS.FINALIZADA)}</option>
            <option value={RESERVA_STATUS.CANCELADA}>{labelReservaStatus(RESERVA_STATUS.CANCELADA)}</option>
            <option value={RESERVA_STATUS.EXPIRADA}>{labelReservaStatus(RESERVA_STATUS.EXPIRADA)}</option>
          </select>
        </FilterField>
        <FilterField label="Modalidade">
          <select value={filtros.modalidadeId} onChange={(event) => atualizarFiltro("modalidadeId", event.target.value)}>
            <option value="">Todas</option>
            {modalidades.map((modalidade) => (
              <option key={modalidade.id} value={modalidade.id}>{modalidade.nome}</option>
            ))}
          </select>
        </FilterField>
        <FilterField label="Quadra">
          <select value={filtros.quadraId} onChange={(event) => atualizarFiltro("quadraId", event.target.value)}>
            <option value="">Todas</option>
            {quadras.map((quadra) => (
              <option key={quadra.id} value={quadra.id}>{quadra.nome}</option>
            ))}
          </select>
        </FilterField>
        <FilterField label="Pagamento">
          <select value={filtros.pagamentoStatus} onChange={(event) => atualizarFiltro("pagamentoStatus", event.target.value)}>
            <option value="">Todos</option>
            <option value={PAGAMENTO_STATUS.APROVADO}>{labelPagamentoStatusPainel(PAGAMENTO_STATUS.APROVADO)}</option>
            <option value={PAGAMENTO_STATUS.PENDENTE}>{labelPagamentoStatusPainel(PAGAMENTO_STATUS.PENDENTE)}</option>
            <option value={PAGAMENTO_STATUS.RECUSADO}>{labelPagamentoStatusPainel(PAGAMENTO_STATUS.RECUSADO)}</option>
            <option value={PAGAMENTO_STATUS.CANCELADO}>{labelPagamentoStatusPainel(PAGAMENTO_STATUS.CANCELADO)}</option>
            <option value={PAGAMENTO_STATUS.ESTORNADO}>{labelPagamentoStatusPainel(PAGAMENTO_STATUS.ESTORNADO)}</option>
          </select>
        </FilterField>
        <FilterField label="Período">
          <select value={filtros.periodo} onChange={(event) => atualizarFiltro("periodo", event.target.value)}>
            <option value="30d">Últimos 30 dias</option>
            <option value="7d">Últimos 7 dias</option>
            <option value="hoje">Hoje</option>
            <option value="mes">Mês atual</option>
            <option value="todos">Todo o histórico</option>
          </select>
        </FilterField>
      </FilterBar>

      {isLoading ? (
        <LoadingSkeleton blocks={4} className="admin-loading-skeleton--metrics" />
      ) : (
        <section className="admin-metric-grid">
          <MetricCard icon={CalendarCheck} label="Reservas de hoje" value={reservasHoje} detail="No recorte filtrado" tone="blue" />
          <MetricCard icon={Check} label="Confirmadas" value={resumo[RESERVA_STATUS.CONFIRMADA]} detail={`${porcentagem(resumo[RESERVA_STATUS.CONFIRMADA], resumo.total)} do total`} tone="green" />
          <MetricCard icon={Clock3} label="Pendentes" value={resumo[RESERVA_STATUS.AGUARDANDO_PAGAMENTO]} detail="Aguardando pagamento" tone="orange" />
          <MetricCard icon={Ban} label="Canceladas" value={resumo[RESERVA_STATUS.CANCELADA]} detail={`${porcentagem(resumo[RESERVA_STATUS.CANCELADA], resumo.total)} do total`} tone="red" />
        </section>
      )}

      <section className="admin-panel admin-panel--reservations">
        <header>
          <h2>Reservas recentes</h2>
          <span className="admin-panel__badge">{reservasFiltradas.length} resultado{reservasFiltradas.length === 1 ? "" : "s"}</span>
        </header>
        <AdminState
          error={error}
          isLoading={isLoading}
          loadingText="Carregando reservas..."
        />
        {feedback && <p className="admin-success">{feedback}</p>}
        {!isLoading && !error && reservasFiltradas.length === 0 && (
          <EmptyState
            title="Nenhuma reserva encontrada"
            description="Ajuste a busca, período ou filtros para encontrar reservas existentes."
          />
        )}
        {!isLoading && !error && reservasFiltradas.length > 0 && (
          <>
            <ReservationTable
              actionsForReservation={acoesReserva}
              formatDate={formatarDataAdmin}
              formatTime={formatarHoraAdmin}
              onAction={executarAcao}
              paymentLabel={labelPagamentoStatusPainel}
              reservations={reservasPaginadas}
              savingAction={savingAction}
              statusLabel={labelReservaStatus}
            />
            <Pagination
              end={paginationEnd}
              onPageChange={setPage}
              page={paginaAtual}
              pageCount={pageCount}
              start={paginationStart}
              total={reservasFiltradas.length}
            />
          </>
        )}
      </section>

      {!isLoading && !error && reservasFiltradas.length > 0 && (
        <section className="admin-reservation-insights">
          <ReportChartCard title="Reservas por status">
            <div className="admin-status-summary">
              {RESERVA_STATUS_FILTRO_ADMIN.map((status) => (
                <span key={status}>
                  <i className={`admin-status-dot admin-status-dot--${status}`} />
                  {labelReservaStatus(status)}
                  <strong>{resumo[status]}</strong>
                </span>
              ))}
            </div>
          </ReportChartCard>
          <ReportChartCard title="Receita confirmada">
            <div className="admin-insight-number">
              <strong>{formatarMoedaAdmin(resumo.receitaConfirmada)}</strong>
              <span>Somente reservas com pagamento aprovado no recorte atual.</span>
            </div>
          </ReportChartCard>
          <ReportChartCard title="Taxa de conversão">
            <div className="admin-insight-number">
              <strong>{conversionRate}</strong>
              <span>Confirmadas e finalizadas sobre o total filtrado.</span>
            </div>
          </ReportChartCard>
        </section>
      )}
    </div>
  );
}
