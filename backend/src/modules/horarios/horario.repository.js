import { Op } from "sequelize";
import Horario from "../../models/Horario.js";
import Quadra from "../../models/Quadra.js";
import Reserva from "../../models/Reserva.js";
import { HORARIO_STATUS, QUADRA_STATUS } from "../../shared/constants/statusAdministrativos.js";
import { RESERVA_STATUS_COM_HORARIO_ATIVO } from "../../shared/constants/reservaStatus.js";

export async function buscarQuadraPorId(id) {
  return Quadra.findByPk(id);
}

export async function buscarHorarioDuplicado({ quadraId, data, horaInicio }) {
  return Horario.findOne({ where: { quadraId, data, horaInicio } });
}

export async function criarHorario(dados) {
  return Horario.create(dados);
}

export async function listarHorarios(where) {
  return Horario.findAll({
    where,
    include: [{ model: Quadra, as: "quadra" }],
    order: [["data", "ASC"], ["horaInicio", "ASC"]],
  });
}

export async function listarHorariosDisponiveis(where) {
  return Horario.findAll({
    where,
    include: [{ model: Quadra, as: "quadra", where: { status: QUADRA_STATUS.ATIVA } }],
    order: [["data", "ASC"], ["horaInicio", "ASC"]],
  });
}

export async function buscarHorarioPorId(id) {
  return Horario.findByPk(id);
}

export async function buscarReservaAtivaPorHorario(horarioId) {
  return Reserva.findOne({
    where: { horarioId, status: { [Op.in]: RESERVA_STATUS_COM_HORARIO_ATIVO } },
  });
}

export async function atualizarStatusHorario(horario, status) {
  return horario.update({ status });
}

export function filtrosDisponibilidadeBase({ horaAbertura, horaFechamento }) {
  return {
    status: HORARIO_STATUS.DISPONIVEL,
    horaInicio: { [Op.gte]: horaAbertura, [Op.lt]: horaFechamento },
  };
}

export { Op };
