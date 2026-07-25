import { fn, col, Op, literal } from "sequelize";
import AcessoPagina from "../../models/AcessoPagina.js";
import Cliente from "../../models/Cliente.js";
import Horario from "../../models/Horario.js";
import Modalidade from "../../models/Modalidade.js";
import Quadra from "../../models/Quadra.js";
import Reserva from "../../models/Reserva.js";
import { PAGAMENTO_STATUS } from "../../shared/constants/pagamentoStatus.js";
import { RESERVA_STATUS } from "../../shared/constants/reservaStatus.js";
import { HORARIO_STATUS, QUADRA_STATUS } from "../../shared/constants/statusAdministrativos.js";

export function filtroPeriodoReservas(inicio, fim) {
  return { data: { [Op.between]: [inicio, fim] } };
}

export function registrarAcesso(dados) {
  return AcessoPagina.create(dados);
}

export function contarReservasHoje(hoje) {
  return Reserva.count({ where: { data: hoje } });
}

export function contarReservasPeriodo(inicio, fim) {
  return Reserva.count({ where: filtroPeriodoReservas(inicio, fim) });
}

export function contarClientes() {
  return Cliente.count();
}

export function contarQuadrasAtivas() {
  return Quadra.count({ where: { status: QUADRA_STATUS.ATIVA } });
}

export function contarReservasConfirmadas() {
  return Reserva.count({ where: { status: RESERVA_STATUS.CONFIRMADA } });
}

export function contarReservasCanceladas() {
  return Reserva.count({ where: { status: RESERVA_STATUS.CANCELADA } });
}

export function listarHorariosMaisProcurados() {
  return Reserva.findAll({
    attributes: ["horaInicio", [fn("COUNT", col("id")), "total"]],
    group: ["horaInicio"],
    order: [[literal("total"), "DESC"]],
    limit: 5,
    raw: true,
  });
}

export function agruparReservasPorStatus(where) {
  return Reserva.findAll({
    where,
    attributes: ["status", [fn("COUNT", col("id")), "total"]],
    group: ["status"],
    order: [["status", "ASC"]],
    raw: true,
  });
}

export function contarReservas(where) {
  return Reserva.count({ where });
}

export function contarPagamentosGerados(where) {
  return Reserva.count({ where: { ...where, pagamentoCriadoEm: { [Op.ne]: null } } });
}

export function contarPagamentosAprovados(where) {
  return Reserva.count({ where: { ...where, pagamentoStatus: PAGAMENTO_STATUS.APROVADO } });
}

export function contarHorarios() {
  return Horario.count();
}

export function contarHorariosReservados() {
  return Horario.count({ where: { status: HORARIO_STATUS.RESERVADO } });
}

export function listarOcupacaoPorQuadra() {
  return Quadra.findAll({
    attributes: [
      "id",
      "nome",
      [fn("COUNT", col("horarios.id")), "totalHorarios"],
      [literal(`COUNT(CASE WHEN horarios.status = '${HORARIO_STATUS.RESERVADO}' THEN 1 END)`), "horariosReservados"],
    ],
    include: [{ model: Horario, as: "horarios", attributes: [], required: false }],
    group: ["Quadra.id"],
    order: [["nome", "ASC"]],
    raw: true,
  });
}

export function listarModalidadesComReservas() {
  return Modalidade.findAll({
    attributes: ["id", "nome", [fn("COUNT", col("reservas.id")), "totalReservas"]],
    include: [{ model: Reserva, as: "reservas", attributes: [], required: false }],
    group: ["Modalidade.id"],
    order: [[literal("\"totalReservas\""), "DESC"]],
    raw: true,
  });
}

export function contarAcessos(where) {
  return AcessoPagina.count({ where });
}

export function contarVisitantesUnicos(where) {
  return AcessoPagina.count({ where, distinct: true, col: "visitante_id" });
}

export function buscarUltimoAcesso(where) {
  return AcessoPagina.findOne({
    where,
    attributes: ["criadoEm"],
    order: [["criadoEm", "DESC"]],
  });
}
