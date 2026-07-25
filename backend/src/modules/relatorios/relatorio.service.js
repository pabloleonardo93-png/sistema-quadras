import { hojeLocal } from "../../utils/validacoes.js";
import * as repository from "./relatorio.repository.js";

function formatarData(data) {
  const ano = data.getFullYear();
  const mes = String(data.getMonth() + 1).padStart(2, "0");
  const dia = String(data.getDate()).padStart(2, "0");
  return ano + "-" + mes + "-" + dia;
}

export async function registrarAcesso(dados) {
  await repository.registrarAcesso(dados);
}

export async function obterDashboard() {
  const hoje = hojeLocal();
  const inicio = new Date();
  inicio.setDate(inicio.getDate() - inicio.getDay());
  const fim = new Date(inicio);
  fim.setDate(fim.getDate() + 6);

  const [
    reservasHoje,
    reservasSemana,
    clientesCadastrados,
    quadrasAtivas,
    reservasConfirmadas,
    reservasCanceladas,
    horariosMaisProcurados,
  ] = await Promise.all([
    repository.contarReservasHoje(hoje),
    repository.contarReservasPeriodo(formatarData(inicio), formatarData(fim)),
    repository.contarClientes(),
    repository.contarQuadrasAtivas(),
    repository.contarReservasConfirmadas(),
    repository.contarReservasCanceladas(),
    repository.listarHorariosMaisProcurados(),
  ]);

  return {
    reservasHoje,
    reservasSemana,
    clientesCadastrados,
    quadrasAtivas,
    reservasConfirmadas,
    reservasCanceladas,
    horariosMaisProcurados,
  };
}

export async function obterReservas({ inicio, fim }) {
  const where = inicio && fim ? repository.filtroPeriodoReservas(inicio, fim) : {};

  const [
    agrupadasPorStatus,
    total,
    pagamentosGerados,
    pagamentosAprovados,
  ] = await Promise.all([
    repository.agruparReservasPorStatus(where),
    repository.contarReservas(where),
    repository.contarPagamentosGerados(where),
    repository.contarPagamentosAprovados(where),
  ]);

  return {
    total,
    agrupadasPorStatus,
    pagamentosGerados,
    pagamentosAprovados,
  };
}

export async function obterOcupacao() {
  const [totalHorarios, horariosReservados, quadras] = await Promise.all([
    repository.contarHorarios(),
    repository.contarHorariosReservados(),
    repository.listarOcupacaoPorQuadra(),
  ]);
  const taxaOcupacao = totalHorarios === 0 ? 0 : Number(((horariosReservados / totalHorarios) * 100).toFixed(2));

  return { totalHorarios, horariosReservados, taxaOcupacao, quadras };
}

export async function obterModalidades() {
  const dados = await repository.listarModalidadesComReservas();
  return { modalidades: dados };
}

export async function obterAcessos({ pagina }) {
  const where = { pagina };
  const [totalAcessos, visitantesUnicos, ultimoAcesso] = await Promise.all([
    repository.contarAcessos(where),
    repository.contarVisitantesUnicos(where),
    repository.buscarUltimoAcesso(where),
  ]);

  return {
    pagina,
    totalAcessos,
    visitantesUnicos,
    ultimoAcesso: ultimoAcesso?.criadoEm || null,
  };
}
