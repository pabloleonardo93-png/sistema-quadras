import sequelize from "../../config/database.js";
import Horario from "../../models/Horario.js";
import Reserva from "../../models/Reserva.js";
import { inclusoesReserva } from "../reservas/reserva.repository.js";

export function buscarReservaParaPagamento(id) {
  return Reserva.findByPk(id, { include: inclusoesReserva });
}

export function buscarReservaAtualizada(id) {
  return Reserva.findByPk(id, { include: inclusoesReserva });
}

export function executarEmTransacao(callback) {
  return sequelize.transaction(callback);
}

export function buscarReservaParaWebhook({ where, transaction }) {
  return Reserva.findOne({
    where,
    include: inclusoesReserva,
    transaction,
    lock: transaction.LOCK.UPDATE,
  });
}

export function atualizarReserva(reserva, dados, transaction) {
  return reserva.update(dados, { transaction });
}

export function liberarHorario(horarioId, status, transaction) {
  return Horario.update(
    { status },
    { where: { id: horarioId }, transaction },
  );
}
