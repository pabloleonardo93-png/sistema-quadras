import { Op, UniqueConstraintError } from "sequelize";
import sequelize from "../config/database.js";
import Cliente from "../models/Cliente.js";
import Horario from "../models/Horario.js";
import Modalidade from "../models/Modalidade.js";
import Quadra from "../models/Quadra.js";
import Reserva from "../models/Reserva.js";
import ErroDaAplicacao from "../utils/ErroDaAplicacao.js";
import { hojeLocal, validarId } from "../utils/validacoes.js";
import { registrarLog } from "./logService.js";

export const inclusoesReserva = [
  { model: Cliente, as: "cliente" },
  { model: Quadra, as: "quadra" },
  { model: Modalidade, as: "modalidade" },
  { model: Horario, as: "horario" },
];

export async function verificarHorarioDisponivel({ quadra, horario, transaction }) {
  if (!horario || horario.quadraId !== quadra.id) {
    throw new ErroDaAplicacao("O horário não pertence à quadra informada.");
  }
  if (horario.data < hojeLocal()) {
    throw new ErroDaAplicacao("Não é possível reservar uma data passada.");
  }
  if (horario.status !== "disponivel") {
    throw new ErroDaAplicacao("Horário não está disponível.", 409);
  }

  const reservaExistente = await Reserva.findOne({
    where: {
      quadraId: quadra.id,
      data: horario.data,
      horaInicio: horario.horaInicio,
      status: { [Op.ne]: "cancelada" },
    },
    transaction,
    lock: transaction.LOCK.UPDATE,
  });

  if (reservaExistente) {
    throw new ErroDaAplicacao("Já existe uma reserva para essa quadra nesse dia e horário.", 409);
  }
}

export async function criarReserva({
  clienteId,
  quadraId,
  modalidadeId,
  horarioId,
  observacoes,
  adminId = null,
  enderecoIp = null,
}) {
  try {
    return await sequelize.transaction(async (transaction) => {
      const cliente = await Cliente.findByPk(validarId(clienteId, "Cliente"), { transaction });
      if (!cliente || cliente.status !== "ativo") {
        throw new ErroDaAplicacao("Cliente não encontrado ou inativo.", 409);
      }

      const quadra = await Quadra.findByPk(validarId(quadraId, "Quadra"), {
        include: [{ model: Modalidade, as: "modalidades", attributes: ["id"] }],
        transaction,
      });
      if (!quadra || quadra.status !== "ativa") {
        throw new ErroDaAplicacao("A quadra não existe ou não está ativa.", 409);
      }

      const modalidade = await Modalidade.findByPk(validarId(modalidadeId, "Modalidade"), { transaction });
      if (!modalidade || modalidade.status !== "ativa") {
        throw new ErroDaAplicacao("Modalidade não encontrada ou inativa.", 409);
      }
      if (!quadra.modalidades.some((item) => item.id === modalidade.id)) {
        throw new ErroDaAplicacao("A modalidade não é permitida nessa quadra.", 409);
      }

      const horario = await Horario.findByPk(validarId(horarioId, "Horário"), {
        transaction,
        lock: transaction.LOCK.UPDATE,
      });
      await verificarHorarioDisponivel({ quadra, horario, transaction });

      const reserva = await Reserva.create({
        clienteId: cliente.id,
        quadraId: quadra.id,
        modalidadeId: modalidade.id,
        horarioId: horario.id,
        data: horario.data,
        horaInicio: horario.horaInicio,
        horaFim: horario.horaFim,
        observacoes: typeof observacoes === "string" ? observacoes.trim() || null : null,
      }, { transaction });

      await horario.update({ status: "reservado" }, { transaction });
      await registrarLog({
        adminId,
        acao: "reserva_criada",
        entidade: "reserva",
        entidadeId: reserva.id,
        enderecoIp,
        detalhes: { clienteId: cliente.id, quadraId: quadra.id, horarioId: horario.id },
        transaction,
      });
      return Reserva.findByPk(reserva.id, { include: inclusoesReserva, transaction });
    });
  } catch (erro) {
    if (erro instanceof UniqueConstraintError) {
      throw new ErroDaAplicacao("Já existe uma reserva para essa quadra nesse dia e horário.", 409);
    }
    throw erro;
  }
}

export async function alterarStatusDaReserva({
  id,
  statusEsperados,
  novoStatus,
  adminId,
  enderecoIp,
}) {
  return sequelize.transaction(async (transaction) => {
    const reserva = await Reserva.findByPk(validarId(id, "Reserva"), {
      transaction,
      lock: transaction.LOCK.UPDATE,
    });
    if (!reserva) throw new ErroDaAplicacao("Reserva não encontrada.", 404);
    if (!statusEsperados.includes(reserva.status)) {
      throw new ErroDaAplicacao("A reserva " + reserva.status + " não pode mudar para " + novoStatus + ".", 409);
    }

    const statusAnterior = reserva.status;
    await reserva.update({ status: novoStatus }, { transaction });
    if (novoStatus === "cancelada") {
      await Horario.update(
        { status: "disponivel" },
        { where: { id: reserva.horarioId }, transaction },
      );
    }

    await registrarLog({
      adminId,
      acao: "reserva_" + novoStatus,
      entidade: "reserva",
      entidadeId: reserva.id,
      enderecoIp,
      detalhes: { statusAnterior, novoStatus },
      transaction,
    });
    return Reserva.findByPk(reserva.id, { include: inclusoesReserva, transaction });
  });
}
