import { Op } from "sequelize";
import sequelize from "../../config/database.js";
import Cliente from "../../models/Cliente.js";
import Horario from "../../models/Horario.js";
import Modalidade from "../../models/Modalidade.js";
import Quadra from "../../models/Quadra.js";
import Reserva from "../../models/Reserva.js";
import { PAGAMENTO_STATUS } from "../../shared/constants/pagamentoStatus.js";
import {
  RESERVA_STATUS,
  RESERVA_STATUS_SEM_CONFLITO_DE_HORARIO,
} from "../../shared/constants/reservaStatus.js";

export const inclusoesReserva = [
  { model: Cliente, as: "cliente" },
  { model: Quadra, as: "quadra" },
  { model: Modalidade, as: "modalidade" },
  { model: Horario, as: "horario" },
];

export function executarEmTransacao(callback) {
  return sequelize.transaction(callback);
}

export function buscarClientePorId(id, transaction) {
  return Cliente.findByPk(id, { transaction });
}

export function buscarQuadraPorIdComModalidades(id, transaction) {
  return Quadra.findByPk(id, {
    include: [{ model: Modalidade, as: "modalidades", attributes: ["id"] }],
    transaction,
  });
}

export function buscarModalidadePorId(id, transaction) {
  return Modalidade.findByPk(id, { transaction });
}

export function buscarHorarioPorIdParaReserva(id, transaction) {
  return Horario.findByPk(id, {
    transaction,
    lock: transaction.LOCK.UPDATE,
  });
}

export function buscarConflitoDeReserva({ quadraId, data, horaInicio, transaction }) {
  return Reserva.findOne({
    where: {
      quadraId,
      data,
      horaInicio,
      status: { [Op.notIn]: RESERVA_STATUS_SEM_CONFLITO_DE_HORARIO },
    },
    transaction,
    lock: transaction.LOCK.UPDATE,
  });
}

export function criarReserva(dados, transaction) {
  return Reserva.create(dados, { transaction });
}

export function atualizarCliente(cliente, dados, transaction) {
  return cliente.update(dados, { transaction });
}

export function atualizarHorarioStatus(horarioId, status, transaction) {
  return Horario.update(
    { status },
    { where: { id: horarioId }, transaction },
  );
}

export function atualizarHorario(horario, dados, transaction) {
  return horario.update(dados, { transaction });
}

export function buscarReservaPorId(id, { transaction, lock = false, include = false } = {}) {
  return Reserva.findByPk(id, {
    ...(include ? { include: inclusoesReserva } : {}),
    ...(transaction ? { transaction } : {}),
    ...(lock ? { lock: transaction.LOCK.UPDATE } : {}),
  });
}

export function buscarReservaDetalhadaPorId(id, transaction) {
  return buscarReservaPorId(id, { include: true, transaction });
}

export function atualizarReserva(reserva, dados, transaction) {
  return reserva.update(dados, { transaction });
}

export function listarReservas(where) {
  return Reserva.findAll({
    where,
    include: inclusoesReserva,
    order: [["data", "DESC"], ["horaInicio", "DESC"]],
  });
}

export function listarReservasPendentesParaExpirar({ corte, limite, transaction }) {
  return Reserva.findAll({
    where: {
      status: RESERVA_STATUS.AGUARDANDO_PAGAMENTO,
      pagamentoStatus: PAGAMENTO_STATUS.PENDENTE,
      pagamentoCriadoEm: { [Op.ne]: null, [Op.lte]: corte },
    },
    limit: limite,
    order: [["pagamentoCriadoEm", "ASC"]],
    transaction,
    lock: transaction.LOCK.UPDATE,
  });
}
