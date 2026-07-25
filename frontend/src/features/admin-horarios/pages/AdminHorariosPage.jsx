import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AlertTriangle, CalendarCheck, CalendarDays, Check, ChevronRight, UsersRound } from "lucide-react";
import { FilterField } from "../../../components/admin/FilterBar";
import FilterBar from "../../../components/admin/FilterBar";
import LoadingSkeleton from "../../../components/admin/LoadingSkeleton";
import MetricCard from "../../../components/admin/MetricCard";
import ScheduleGrid from "../../../components/admin/ScheduleGrid";
import { bloquearHorario, liberarHorario, listarHorarios } from "../../../services/horarioService";
import { listarModalidades } from "../../../services/modalidadeService";
import { listarQuadrasAdmin } from "../../../services/quadraService";
import { listarReservas } from "../../../services/reservaService";
import { HORARIO_STATUS, QUADRA_STATUS, classeHorarioStatus, labelHorarioStatus } from "../../../shared/constants/adminStatus";
import AdminPageShell from "../../admin-shared/components/AdminPageShell";
import { AdminState } from "../../admin-shared/components/AdminState";
import { Panel } from "../../admin-shared/components/Panel";
import {
  encontrarDataPadraoAgenda,
  formatarDataAdmin,
  formatarDataISOAdmin,
  formatarDataReservaAdmin,
  formatarHoraAdmin,
  normalizarBusca,
  obterDataAdmin,
  obterDataHoraReserva,
} from "../../admin-shared/utils/adminFormatters";

export default function AdminHorariosPage() {
  return (
    <AdminPageShell route="horarios">
      {({ onNavigate, searchQuery }) => <ScheduleScreen onNavigate={onNavigate} searchQuery={searchQuery} />}
    </AdminPageShell>
  );
}

function ScheduleScreen({ searchQuery = "", onNavigate }) {
  const [horarios, setHorarios] = useState([]);
  const [reservas, setReservas] = useState([]);
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
      const [horariosCarregados, reservasCarregadas, quadrasCarregadas, modalidadesCarregadas] = await Promise.all([
        listarHorarios(),
        listarReservas(),
        listarQuadrasAdmin(),
        listarModalidades(),
      ]);
      setHorarios(horariosCarregados);
      setReservas(reservasCarregadas);
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

  const reservasPorHorarioId = useMemo(() => {
    const reservasOrdenadas = [...reservas].sort((a, b) => {
      const dataA = obterDataHoraReserva(a)?.getTime() || 0;
      const dataB = obterDataHoraReserva(b)?.getTime() || 0;
      return dataB - dataA;
    });

    return new Map(
      reservasOrdenadas
        .map((reserva) => [String(reserva.horarioId || reserva.horario?.id || ""), reserva])
        .filter(([horarioId]) => horarioId),
    );
  }, [reservas]);

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
    const termo = normalizarBusca(searchQuery);

    return horarios
      .map((horario) => {
        const quadraId = String(horario.quadraId || horario.quadra?.id || "");
        const quadra = quadrasPorId.get(quadraId) || horario.quadra;
        return {
          ...horario,
          quadra,
          reserva: reservasPorHorarioId.get(String(horario.id)) || horario.reserva || null,
        };
      })
      .filter((horario) => {
        const quadraId = String(horario.quadraId || horario.quadra?.id || "");
        const quadra = quadrasPorId.get(quadraId) || horario.quadra;
        const data = String(horario.data || "").slice(0, 10);

        if (filtros.quadraId && quadraId !== filtros.quadraId) return false;
        if (filtros.data && data !== filtros.data) return false;
        if (filtros.status && horario.status !== filtros.status) return false;
        if (filtros.modalidadeId) {
          const modalidadesDaQuadra = quadra?.modalidades || [];
          if (!modalidadesDaQuadra.some((modalidade) => String(modalidade.id) === filtros.modalidadeId)) {
            return false;
          }
        }
        if (termo) {
          const valores = [
            quadra?.nome,
            ...(quadra?.modalidades || []).map((modalidade) => modalidade.nome),
            horario.reserva?.cliente?.nome,
            horario.reserva?.cliente?.telefone,
            horario.reserva?.cliente?.email,
            labelHorarioStatus(horario.status),
            formatarDataAdmin(data),
            formatarHoraAdmin(horario.horaInicio),
          ];
          return valores.some((valor) => normalizarBusca(valor).includes(termo));
        }
        return true;
      })
      .sort(compararHorario);
  }, [filtros, horarios, quadrasPorId, reservasPorHorarioId, searchQuery]);

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
        [HORARIO_STATUS.DISPONIVEL]: 0,
        [HORARIO_STATUS.RESERVADO]: 0,
        [HORARIO_STATUS.BLOQUEADO]: 0,
        datas: new Set(),
        quadras: new Set(),
      },
    );
    const total = resumo.total || 1;

    return {
      ...resumo,
      datas: resumo.datas.size,
      quadras: resumo.quadras.size,
      percentualLivre: Math.round((resumo[HORARIO_STATUS.DISPONIVEL] / total) * 100),
      percentualReservado: Math.round((resumo[HORARIO_STATUS.RESERVADO] / total) * 100),
      percentualBloqueado: Math.round((resumo[HORARIO_STATUS.BLOQUEADO] / total) * 100),
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

  const alterarDataPorOffset = (offset) => {
    const base = obterDataAdmin(filtros.data || dataPadraoAgenda || formatarDataISOAdmin()) || new Date();
    base.setDate(base.getDate() + offset);
    atualizarFiltro("data", formatarDataISOAdmin(base));
  };

  const executarAcaoHorario = (slot) => {
    if (slot.status === HORARIO_STATUS.BLOQUEADO) {
      return executarAcao(liberarHorario, slot.id);
    }
    if (slot.status === HORARIO_STATUS.DISPONIVEL) {
      return executarAcao(bloquearHorario, slot.id);
    }
    return undefined;
  };

  const dataSelecionada = filtros.data
    ? formatarDataReservaAdmin(filtros.data)
    : null;
  const dataNavegacao = dataSelecionada || formatarDataReservaAdmin(formatarDataISOAdmin());
  const recorteLabel = dataSelecionada
    ? dataSelecionada.full
    : "Todas as datas";
  const statusLabel = filtros.status ? labelHorarioStatus(filtros.status) : undefined;
  const recorteFiltros = [
    quadraSelecionada?.nome,
    modalidadeSelecionada?.nome,
    statusLabel,
  ].filter(Boolean);
  const recorteDetalhe = recorteFiltros.length
    ? recorteFiltros.join(", ")
    : "Todas as quadras e modalidades";
  const quadrasEmManutencao = quadras.filter((quadra) => quadra.status === QUADRA_STATUS.MANUTENCAO).length;

  return (
    <div className="admin-page admin-page--schedule">
      <section className="admin-date-navigator" aria-label="Navegação por data">
        <button type="button" onClick={() => alterarDataPorOffset(-1)} aria-label="Dia anterior">
          <ChevronRight aria-hidden="true" size={18} />
        </button>
        <div>
          <CalendarDays aria-hidden="true" size={19} />
          <span>{dataNavegacao.full}</span>
          <strong>{dataNavegacao.weekday}</strong>
        </div>
        <button type="button" onClick={() => alterarDataPorOffset(1)} aria-label="Próximo dia">
          <ChevronRight aria-hidden="true" size={18} />
        </button>
      </section>

      <FilterBar onClear={limparFiltros}>
        <FilterField label="Quadra">
          <select value={filtros.quadraId} onChange={(event) => atualizarFiltro("quadraId", event.target.value)}>
            <option value="">Todas</option>
            {quadrasFiltradasPorModalidade.map((quadra) => (
              <option key={quadra.id} value={quadra.id}>
                {quadra.nome}
              </option>
            ))}
          </select>
        </FilterField>
        <FilterField label="Modalidade">
          <select value={filtros.modalidadeId} onChange={(event) => atualizarFiltro("modalidadeId", event.target.value)}>
            <option value="">Todas</option>
            {modalidades.map((modalidade) => (
              <option key={modalidade.id} value={modalidade.id}>
                {modalidade.nome}
              </option>
            ))}
          </select>
        </FilterField>
        <FilterField label="Data">
          <input type="date" value={filtros.data} onChange={(event) => atualizarFiltro("data", event.target.value)} />
        </FilterField>
        <FilterField label="Status">
          <select value={filtros.status} onChange={(event) => atualizarFiltro("status", event.target.value)}>
            <option value="">Todos</option>
            <option value={HORARIO_STATUS.DISPONIVEL}>{labelHorarioStatus(HORARIO_STATUS.DISPONIVEL)}</option>
            <option value={HORARIO_STATUS.RESERVADO}>{labelHorarioStatus(HORARIO_STATUS.RESERVADO)}</option>
            <option value={HORARIO_STATUS.BLOQUEADO}>{labelHorarioStatus(HORARIO_STATUS.BLOQUEADO)}</option>
          </select>
        </FilterField>
      </FilterBar>

      {isLoading ? (
        <LoadingSkeleton blocks={4} className="admin-loading-skeleton--metrics" />
      ) : (
        <section className="admin-metric-grid">
          <MetricCard
            icon={CalendarCheck}
            label="Horários exibidos"
            value={resumoHorarios.total}
            detail={`${resumoHorarios.quadras} quadra${resumoHorarios.quadras === 1 ? "" : "s"} no recorte`}
            tone="green"
          />
          <MetricCard
            icon={Check}
            label="Livres"
            value={resumoHorarios[HORARIO_STATUS.DISPONIVEL]}
            detail={`${resumoHorarios.percentualLivre}% disponível`}
            tone="green"
          />
          <MetricCard
            icon={UsersRound}
            label="Reservados"
            value={resumoHorarios[HORARIO_STATUS.RESERVADO]}
            detail={`${resumoHorarios.percentualReservado}% do recorte`}
            tone="blue"
          />
          <MetricCard
            icon={AlertTriangle}
            label="Bloqueados"
            value={resumoHorarios[HORARIO_STATUS.BLOQUEADO]}
            detail={
              quadrasEmManutencao
                ? `${quadrasEmManutencao} quadra${quadrasEmManutencao === 1 ? "" : "s"} em manutenção`
                : `${resumoHorarios.percentualBloqueado}% indisponível`
            }
            tone="red"
          />
        </section>
      )}

      <section className="admin-schedule-legend" aria-label="Legenda de status">
        <button
          type="button"
          aria-pressed={filtros.status === HORARIO_STATUS.DISPONIVEL}
          className={filtros.status === HORARIO_STATUS.DISPONIVEL ? "is-active" : ""}
          onClick={() => atualizarFiltro("status", filtros.status === HORARIO_STATUS.DISPONIVEL ? "" : HORARIO_STATUS.DISPONIVEL)}
        >
          <i className="is-free" />
          Livre
        </button>
        <button
          type="button"
          aria-pressed={filtros.status === HORARIO_STATUS.RESERVADO}
          className={filtros.status === HORARIO_STATUS.RESERVADO ? "is-active" : ""}
          onClick={() => atualizarFiltro("status", filtros.status === HORARIO_STATUS.RESERVADO ? "" : HORARIO_STATUS.RESERVADO)}
        >
          <i className="is-booked" />
          Reservado
        </button>
        <button
          type="button"
          aria-pressed={filtros.status === HORARIO_STATUS.BLOQUEADO}
          className={filtros.status === HORARIO_STATUS.BLOQUEADO ? "is-active" : ""}
          onClick={() => atualizarFiltro("status", filtros.status === HORARIO_STATUS.BLOQUEADO ? "" : HORARIO_STATUS.BLOQUEADO)}
        >
          <i className="is-blocked" />
          Bloqueado
        </button>
        <span>
          <i className="is-maintenance" />
          Manutenção
        </span>
      </section>

      <Panel className="admin-panel--schedule" title="Disponibilidade por quadra">
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
            <p className="admin-muted admin-schedule-recorte">{recorteDetalhe}</p>
            <ScheduleGrid
              formatTime={formatarHoraAdmin}
              groups={gruposAgenda}
              onCourtDetails={() => onNavigate?.("quadras")}
              onSlotAction={executarAcaoHorario}
              savingSlotId={savingSlotId}
              statusClass={classeHorarioStatus}
              statusLabel={labelHorarioStatus}
            />
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
                  <option value={HORARIO_STATUS.DISPONIVEL}>{labelHorarioStatus(HORARIO_STATUS.DISPONIVEL)}</option>
                  <option value={HORARIO_STATUS.RESERVADO}>{labelHorarioStatus(HORARIO_STATUS.RESERVADO)}</option>
                  <option value={HORARIO_STATUS.BLOQUEADO}>{labelHorarioStatus(HORARIO_STATUS.BLOQUEADO)}</option>
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
                <strong>{resumoHorarios[HORARIO_STATUS.DISPONIVEL]}</strong>
                <em>{resumoHorarios.percentualLivre}% disponível</em>
              </article>
              <article className="admin-schedule__summary-item--reservado">
                <small>Reservados</small>
                <strong>{resumoHorarios[HORARIO_STATUS.RESERVADO]}</strong>
                <em>{resumoHorarios.percentualReservado}% do recorte</em>
              </article>
              <article className="admin-schedule__summary-item--bloqueado">
                <small>Bloqueados</small>
                <strong>{resumoHorarios[HORARIO_STATUS.BLOQUEADO]}</strong>
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
                aria-pressed={filtros.status === HORARIO_STATUS.DISPONIVEL}
                className={filtros.status === HORARIO_STATUS.DISPONIVEL ? "is-active" : ""}
                onClick={() => atualizarFiltro("status", filtros.status === HORARIO_STATUS.DISPONIVEL ? "" : HORARIO_STATUS.DISPONIVEL)}
              >
                <i className="is-free" /> Livre
              </button>
              <button
                type="button"
                aria-pressed={filtros.status === HORARIO_STATUS.RESERVADO}
                className={filtros.status === HORARIO_STATUS.RESERVADO ? "is-active" : ""}
                onClick={() => atualizarFiltro("status", filtros.status === HORARIO_STATUS.RESERVADO ? "" : HORARIO_STATUS.RESERVADO)}
              >
                <i className="is-booked" /> Reservado
              </button>
              <button
                type="button"
                aria-pressed={filtros.status === HORARIO_STATUS.BLOQUEADO}
                className={filtros.status === HORARIO_STATUS.BLOQUEADO ? "is-active" : ""}
                onClick={() => atualizarFiltro("status", filtros.status === HORARIO_STATUS.BLOQUEADO ? "" : HORARIO_STATUS.BLOQUEADO)}
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
                        const podeAlternar = slot.status !== HORARIO_STATUS.RESERVADO;
                        const isSaving = savingSlotId === slot.id;
                        return (
                          <button
                            className={`admin-slot admin-slot--${classeHorarioStatus(slot.status)}`}
                            disabled={!podeAlternar || isSaving}
                            key={slot.id}
                            title={isSaving ? "Atualizando horário" : podeAlternar ? "Clique para bloquear ou liberar" : "Horário reservado"}
                            type="button"
                            onClick={() =>
                              slot.status === HORARIO_STATUS.BLOQUEADO
                                ? executarAcao(liberarHorario, slot.id)
                                : executarAcao(bloquearHorario, slot.id)
                            }
                          >
                            <span>{formatarHoraAdmin(slot.horaInicio)}</span>
                            <small>{isSaving ? "Atualizando..." : labelHorarioStatus(slot.status)}</small>
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
