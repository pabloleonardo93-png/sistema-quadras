import { useEffect, useMemo, useState } from "react";
import { Ban, CalendarCheck, Check, CircleDollarSign, Clock3, CreditCard, Hourglass, Percent } from "lucide-react";
import ConversionFunnel from "../../../components/admin/ConversionFunnel";
import { FilterField } from "../../../components/admin/FilterBar";
import FilterBar from "../../../components/admin/FilterBar";
import MetricCard from "../../../components/admin/MetricCard";
import ModalityPerformanceTable from "../../../components/admin/ModalityPerformanceTable";
import ReportChartCard from "../../../components/admin/ReportChartCard";
import { listarModalidades } from "../../../services/modalidadeService";
import { listarQuadrasAdmin } from "../../../services/quadraService";
import { buscarRelatorioFunilReserva, buscarRelatorioModalidades, buscarRelatorioOcupacao, buscarRelatorioReservas } from "../../../services/relatorioService";
import { listarReservas } from "../../../services/reservaService";
import { PAGAMENTO_STATUS, labelPagamentoStatus } from "../../../shared/constants/pagamentoStatus";
import { RESERVA_STATUS, labelReservaStatus } from "../../../shared/constants/reservaStatus";
import AdminPageShell from "../../admin-shared/components/AdminPageShell";
import { AdminState } from "../../admin-shared/components/AdminState";
import {
  calcularResumoStatus,
  formatarDataAdmin,
  formatarMoedaAdmin,
  formatarPercentualAdmin,
  normalizarBusca,
  obterPeriodoRelatorio,
  percentualNumero,
  porcentagem,
  reservaDentroPeriodo,
} from "../../admin-shared/utils/adminFormatters";

export default function AdminRelatoriosPage() {
  return (
    <AdminPageShell route="relatorios">
      {({ searchQuery }) => <ReportsScreen searchQuery={searchQuery} />}
    </AdminPageShell>
  );
}

function ReportsScreen({ searchQuery = "" }) {
  const [reports, setReports] = useState(null);
  const [reservas, setReservas] = useState([]);
  const [quadras, setQuadras] = useState([]);
  const [modalidadesBase, setModalidadesBase] = useState([]);
  const [filtros, setFiltros] = useState({
    modalidadeId: "",
    periodo: "30d",
    quadraId: "",
    status: "",
  });
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let active = true;

    async function carregarRelatorios() {
      setIsLoading(true);
      setError("");
      try {
        const [reservas, modalidades, funil, ocupacao, reservasLista, quadrasLista, modalidadesLista] = await Promise.all([
          buscarRelatorioReservas(obterPeriodoRelatorio(filtros.periodo)),
          buscarRelatorioModalidades(),
          buscarRelatorioFunilReserva(),
          buscarRelatorioOcupacao(),
          listarReservas(),
          listarQuadrasAdmin(),
          listarModalidades(),
        ]);
        if (active) {
          setReports({ funil, modalidades, ocupacao, reservas });
          setReservas(reservasLista);
          setQuadras(quadrasLista);
          setModalidadesBase(modalidadesLista);
        }
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
  }, [filtros.periodo]);

  useEffect(() => {
    const atualizarRelatorios = async () => {
      try {
        const [reservas, modalidades, funil, ocupacao, reservasLista, quadrasLista, modalidadesLista] = await Promise.all([
          buscarRelatorioReservas(obterPeriodoRelatorio(filtros.periodo)),
          buscarRelatorioModalidades(),
          buscarRelatorioFunilReserva(),
          buscarRelatorioOcupacao(),
          listarReservas(),
          listarQuadrasAdmin(),
          listarModalidades(),
        ]);
        setReports({ funil, modalidades, ocupacao, reservas });
        setReservas(reservasLista);
        setQuadras(quadrasLista);
        setModalidadesBase(modalidadesLista);
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
  }, [filtros.periodo]);

  const atualizarFiltroRelatorio = (campo, valor) => {
    setFiltros((current) => ({ ...current, [campo]: valor }));
  };

  const limparFiltrosRelatorio = () => {
    setFiltros({
      modalidadeId: "",
      periodo: "30d",
      quadraId: "",
      status: "",
    });
  };

  const reservasFiltradas = useMemo(() => {
    const termo = normalizarBusca(searchQuery);

    return reservas.filter((reserva) => {
      const quadraId = String(reserva.quadraId || reserva.quadra?.id || "");
      const modalidadeId = String(reserva.modalidadeId || reserva.modalidade?.id || "");

      if (!reservaDentroPeriodo(reserva, filtros.periodo)) return false;
      if (filtros.quadraId && quadraId !== filtros.quadraId) return false;
      if (filtros.modalidadeId && modalidadeId !== filtros.modalidadeId) return false;
      if (filtros.status && reserva.status !== filtros.status) return false;
      if (!termo) return true;

      const valores = [
        reserva.cliente?.nome,
        reserva.cliente?.telefone,
        reserva.cliente?.email,
        reserva.quadra?.nome,
        reserva.modalidade?.nome,
        labelReservaStatus(reserva.status),
        labelPagamentoStatus(reserva.pagamentoStatus),
      ];
      return valores.some((valor) => normalizarBusca(valor).includes(termo));
    });
  }, [filtros, reservas, searchQuery]);

  const resumoRelatorio = useMemo(() => calcularResumoStatus(reservasFiltradas), [reservasFiltradas]);
  const pagamentosPendentes = reservasFiltradas.filter(
    (reserva) => reserva.pagamentoStatus === PAGAMENTO_STATUS.PENDENTE || reserva.status === RESERVA_STATUS.AGUARDANDO_PAGAMENTO,
  ).length;
  const receitaRecebida = reservasFiltradas.reduce(
    (total, reserva) => total + (reserva.pagamentoStatus === PAGAMENTO_STATUS.APROVADO ? Number(reserva.valorTotal || 0) : 0),
    0,
  );
  const taxaConversaoValor = percentualNumero(
    reports?.reservas?.pagamentosAprovados
      ?? resumoRelatorio[RESERVA_STATUS.CONFIRMADA] + resumoRelatorio[RESERVA_STATUS.FINALIZADA],
    reports?.reservas?.pagamentosGerados || resumoRelatorio.total,
  );
  const taxaOcupacaoValor = reports?.ocupacao?.taxaOcupacao ?? null;
  const reservasPorStatusReais = [
    { id: RESERVA_STATUS.CONFIRMADA, label: "Confirmadas", value: resumoRelatorio[RESERVA_STATUS.CONFIRMADA], tone: "green" },
    { id: RESERVA_STATUS.AGUARDANDO_PAGAMENTO, label: "Pendentes", value: resumoRelatorio[RESERVA_STATUS.AGUARDANDO_PAGAMENTO], tone: "orange" },
    { id: RESERVA_STATUS.CANCELADA, label: "Canceladas", value: resumoRelatorio[RESERVA_STATUS.CANCELADA], tone: "red" },
    { id: RESERVA_STATUS.EXPIRADA, label: "Expiradas", value: resumoRelatorio[RESERVA_STATUS.EXPIRADA], tone: "gray" },
    { id: RESERVA_STATUS.FINALIZADA, label: "Finalizadas", value: resumoRelatorio[RESERVA_STATUS.FINALIZADA], tone: "blue" },
  ].filter((item) => item.value > 0);
  const maxStatus = Math.max(1, ...reservasPorStatusReais.map((item) => item.value));
  const reservasPorDia = Object.entries(
    reservasFiltradas.reduce((acc, reserva) => {
      const data = String(reserva.data || "").slice(0, 10) || "sem-data";
      acc[data] = (acc[data] || 0) + 1;
      return acc;
    }, {}),
  )
    .sort(([dataA], [dataB]) => dataA.localeCompare(dataB))
    .slice(-14)
    .map(([data, total]) => ({ data, total }));
  const maxReservasDia = Math.max(1, ...reservasPorDia.map((item) => item.total));
  const receitaPorDia = Object.entries(
    reservasFiltradas.reduce((acc, reserva) => {
      if (reserva.pagamentoStatus !== PAGAMENTO_STATUS.APROVADO) return acc;
      const data = String(reserva.pagoEm || reserva.data || "").slice(0, 10) || "sem-data";
      acc[data] = (acc[data] || 0) + Number(reserva.valorTotal || 0);
      return acc;
    }, {}),
  )
    .sort(([dataA], [dataB]) => dataA.localeCompare(dataB))
    .slice(-8)
    .map(([data, total]) => ({ data, total }));
  const maxReceitaDia = Math.max(1, ...receitaPorDia.map((item) => item.total));
  const desempenhoModalidades = Object.values(
    reservasFiltradas.reduce((acc, reserva) => {
      const modalidade = reserva.modalidade?.nome || "Sem modalidade";
      if (!acc[modalidade]) {
        acc[modalidade] = {
          canceled: 0,
          confirmed: 0,
          expired: 0,
          name: modalidade,
          revenue: 0,
          total: 0,
        };
      }
      acc[modalidade].total += 1;
      if ([RESERVA_STATUS.CONFIRMADA, RESERVA_STATUS.FINALIZADA].includes(reserva.status)) acc[modalidade].confirmed += 1;
      if (reserva.status === RESERVA_STATUS.CANCELADA) acc[modalidade].canceled += 1;
      if (reserva.status === RESERVA_STATUS.EXPIRADA) acc[modalidade].expired += 1;
      if (reserva.pagamentoStatus === PAGAMENTO_STATUS.APROVADO) acc[modalidade].revenue += Number(reserva.valorTotal || 0);
      return acc;
    }, {}),
  )
    .map((row) => ({
      ...row,
      conversion: porcentagem(row.confirmed, row.total),
      revenue: row.revenue ? formatarMoedaAdmin(row.revenue) : "--",
    }))
    .sort((a, b) => b.total - a.total);
  const ocupacaoPorQuadra = (reports?.ocupacao?.quadras || [])
    .filter((quadra) => !filtros.quadraId || String(quadra.id) === filtros.quadraId)
    .map((quadra) => {
      const totalHorarios = Number(quadra.totalHorarios || 0);
      const horariosReservados = Number(quadra.horariosReservados || 0);
      return {
        id: quadra.id,
        nome: quadra.nome,
        taxa: percentualNumero(horariosReservados, totalHorarios, 0) ?? 0,
        totalHorarios,
      };
    });
  const funilReserva = reports?.funil || {};
  const metricasFunil = (chave) =>
    funilReserva[chave] || { totalAcessos: 0, visitantesUnicos: 0 };
  const marcacaoReserva = metricasFunil("marcacao");
  const dadosReserva = metricasFunil("dados");
  const pagamentoReserva = metricasFunil("pagamento");
  const pagamentoGerado = metricasFunil("pagamentoGerado");
  const etapasFunil = [
    {
      id: "marcacao",
      label: "Iniciaram a reserva",
      value: Number(marcacaoReserva.visitantesUnicos || 0),
    },
    {
      id: "dados",
      label: "Preencheram os dados",
      value: Number(dadosReserva.visitantesUnicos || 0),
    },
    {
      id: "pagamento",
      label: "Chegaram ao pagamento",
      value: Number(pagamentoReserva.visitantesUnicos || 0),
    },
    {
      id: "pagamento-gerado",
      label: "Pagamento gerado",
      value: Number(reports?.reservas?.pagamentosGerados || pagamentoGerado.totalAcessos || 0),
    },
    {
      id: "pagaram",
      label: "Pagaram",
      value: Number(reports?.reservas?.pagamentosAprovados || 0),
    },
    {
      id: "confirmadas",
      label: "Reserva confirmada",
      value: Number(resumoRelatorio[RESERVA_STATUS.CONFIRMADA] || 0),
    },
  ];

  return (
    <div className="admin-page admin-report-page">
      <FilterBar onClear={limparFiltrosRelatorio}>
        <FilterField label="Período">
          <select value={filtros.periodo} onChange={(event) => atualizarFiltroRelatorio("periodo", event.target.value)}>
            <option value="7d">Últimos 7 dias</option>
            <option value="30d">Últimos 30 dias</option>
            <option value="mes">Mês atual</option>
            <option value="todos">Todo o histórico</option>
          </select>
        </FilterField>
        <FilterField label="Modalidade">
          <select value={filtros.modalidadeId} onChange={(event) => atualizarFiltroRelatorio("modalidadeId", event.target.value)}>
            <option value="">Todas</option>
            {modalidadesBase.map((modalidade) => (
              <option key={modalidade.id} value={modalidade.id}>
                {modalidade.nome}
              </option>
            ))}
          </select>
        </FilterField>
        <FilterField label="Quadra">
          <select value={filtros.quadraId} onChange={(event) => atualizarFiltroRelatorio("quadraId", event.target.value)}>
            <option value="">Todas</option>
            {quadras.map((quadra) => (
              <option key={quadra.id} value={quadra.id}>
                {quadra.nome}
              </option>
            ))}
          </select>
        </FilterField>
        <FilterField label="Status">
          <select value={filtros.status} onChange={(event) => atualizarFiltroRelatorio("status", event.target.value)}>
            <option value="">Todos</option>
            <option value={RESERVA_STATUS.CONFIRMADA}>{labelReservaStatus(RESERVA_STATUS.CONFIRMADA)}</option>
            <option value={RESERVA_STATUS.AGUARDANDO_PAGAMENTO}>{labelReservaStatus(RESERVA_STATUS.AGUARDANDO_PAGAMENTO)}</option>
            <option value={RESERVA_STATUS.FINALIZADA}>{labelReservaStatus(RESERVA_STATUS.FINALIZADA)}</option>
            <option value={RESERVA_STATUS.CANCELADA}>{labelReservaStatus(RESERVA_STATUS.CANCELADA)}</option>
            <option value={RESERVA_STATUS.EXPIRADA}>{labelReservaStatus(RESERVA_STATUS.EXPIRADA)}</option>
          </select>
        </FilterField>
      </FilterBar>

      <AdminState error={error} isLoading={isLoading} loadingText="Carregando relatórios..." />

      {!isLoading && !error && (
        <>
          <section className="admin-metric-grid admin-metric-grid--reports">
            <MetricCard icon={CalendarCheck} label="Total de reservas" value={resumoRelatorio.total} detail="No recorte filtrado" tone="blue" />
            <MetricCard icon={CircleDollarSign} label="Receita recebida" value={formatarMoedaAdmin(receitaRecebida)} detail="Pagamentos aprovados" tone="green" />
            <MetricCard icon={Percent} label="Taxa de conversão" value={formatarPercentualAdmin(taxaConversaoValor)} detail="Pagamentos aprovados sobre gerados" tone="blue" />
            <MetricCard icon={Clock3} label="Taxa de ocupação" value={formatarPercentualAdmin(taxaOcupacaoValor)} detail="Calculada pelo relatório de ocupação" tone="orange" />
          </section>

          <section className="admin-metric-grid admin-metric-grid--reports">
            <MetricCard icon={Check} label="Confirmadas" value={resumoRelatorio[RESERVA_STATUS.CONFIRMADA]} detail={`${porcentagem(resumoRelatorio[RESERVA_STATUS.CONFIRMADA], resumoRelatorio.total)} do total`} tone="green" />
            <MetricCard icon={Ban} label="Canceladas" value={resumoRelatorio[RESERVA_STATUS.CANCELADA]} detail={`${porcentagem(resumoRelatorio[RESERVA_STATUS.CANCELADA], resumoRelatorio.total)} do total`} tone="red" />
            <MetricCard icon={Hourglass} label="Expiradas" value={resumoRelatorio[RESERVA_STATUS.EXPIRADA]} detail={`${porcentagem(resumoRelatorio[RESERVA_STATUS.EXPIRADA], resumoRelatorio.total)} do total`} tone="gray" />
            <MetricCard icon={CreditCard} label="Pagamentos pendentes" value={pagamentosPendentes} detail="Reservas aguardando retorno" tone="orange" />
          </section>

          <section className="admin-report-grid">
            <ReportChartCard title="Reservas por status" empty={!reservasPorStatusReais.length}>
              <div className="admin-report-status-bars">
                {reservasPorStatusReais.map((item) => (
                  <div key={item.id}>
                    <span>
                      <i className={`admin-status-dot admin-status-dot--${item.id}`} />
                      {item.label}
                    </span>
                    <strong>{item.value}</strong>
                    <em>
                      <b style={{ width: `${(item.value / maxStatus) * 100}%` }} />
                    </em>
                  </div>
                ))}
              </div>
            </ReportChartCard>

            <ReportChartCard title="Evolução das reservas" empty={!reservasPorDia.length}>
              <div className="admin-report-column-chart">
                {reservasPorDia.map((item) => (
                  <span key={item.data}>
                    <strong>{item.total}</strong>
                    <i style={{ height: `${(item.total / maxReservasDia) * 100}%` }} />
                    <small>{formatarDataAdmin(item.data).slice(0, 5)}</small>
                  </span>
                ))}
              </div>
            </ReportChartCard>

            <ReportChartCard title="Funil de conversão" empty={!etapasFunil.some((step) => step.value > 0)}>
              <ConversionFunnel steps={etapasFunil} />
            </ReportChartCard>

            <ReportChartCard title="Desempenho por modalidade" empty={!desempenhoModalidades.length}>
              <ModalityPerformanceTable rows={desempenhoModalidades} />
            </ReportChartCard>

            <ReportChartCard title="Ocupação por quadra" empty={!ocupacaoPorQuadra.length}>
              <div className="admin-report-bars-modern">
                {ocupacaoPorQuadra.map((quadra) => (
                  <div key={quadra.id}>
                    <span>
                      {quadra.nome}
                      <strong>{formatarPercentualAdmin(quadra.taxa, 0)}</strong>
                    </span>
                    <i>
                      <b style={{ width: `${Math.min(quadra.taxa, 100)}%` }} />
                    </i>
                  </div>
                ))}
              </div>
            </ReportChartCard>

            <ReportChartCard title="Receita por período" empty={!receitaPorDia.length}>
              <div className="admin-report-bars-modern admin-report-bars-modern--revenue">
                {receitaPorDia.map((item) => (
                  <div key={item.data}>
                    <span>
                      {formatarDataAdmin(item.data).slice(0, 5)}
                      <strong>{formatarMoedaAdmin(item.total)}</strong>
                    </span>
                    <i>
                      <b style={{ width: `${Math.min((item.total / maxReceitaDia) * 100, 100)}%` }} />
                    </i>
                  </div>
                ))}
              </div>
            </ReportChartCard>
          </section>
        </>
      )}
    </div>
  );
}
