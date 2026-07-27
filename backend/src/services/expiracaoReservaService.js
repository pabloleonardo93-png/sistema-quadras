import { Op } from "sequelize";
import { calcularCorteExpiracao, calcularPagamentoExpiraEm, intervaloExpiracaoPagamentosMs } from "../config/pagamento.js";
import sequelize from "../config/database.js";
import Horario from "../models/Horario.js";
import Reserva from "../models/Reserva.js";
import { registrarLog } from "./logService.js";

export function dadosExpiracaoPagamento(reserva) {
  const pagamentoExpiraEm = reserva?.pagamentoExpiraEm || calcularPagamentoExpiraEm(reserva?.pagamentoCriadoEm);
  return {
    pagamentoExpiraEm: pagamentoExpiraEm?.toISOString() || null,
  };
}

export async function expirarReservasPendentes({ agora = new Date(), limite = 100 } = {}) {
  const corte = calcularCorteExpiracao(agora);
  if (!corte) return { expiradas: 0 };

  return sequelize.transaction(async (transaction) => {
    const reservas = await Reserva.findAll({
      where: {
        status: "aguardando_pagamento",
        pagamentoStatus: "pendente",
        [Op.or]: [
          { pagamentoExpiraEm: { [Op.ne]: null, [Op.lte]: agora } },
          { pagamentoExpiraEm: null, pagamentoCriadoEm: { [Op.ne]: null, [Op.lte]: corte } },
        ],
      },
      limit: limite,
      order: [["pagamentoCriadoEm", "ASC"]],
      transaction,
      lock: transaction.LOCK.UPDATE,
    });

    for (const reserva of reservas) {
      await reserva.update({
        status: "expirada",
        pagamentoStatus: "cancelado",
      }, { transaction });

      await Horario.update(
        { status: "disponivel" },
        { where: { id: reserva.horarioId }, transaction },
      );

      await registrarLog({
        acao: "reserva_expirada",
        entidade: "reserva",
        entidadeId: reserva.id,
        detalhes: {
          motivo: "pagamento_nao_aprovado_no_prazo",
          pagamentoCriadoEm: reserva.pagamentoCriadoEm,
          pagamentoExpiraEm: dadosExpiracaoPagamento(reserva).pagamentoExpiraEm,
        },
        transaction,
      });
    }

    return { expiradas: reservas.length };
  });
}

export function iniciarExpiradorReservasPendentes() {
  const intervalo = setInterval(() => {
    expirarReservasPendentes().catch((erro) => {
      console.error("Nao foi possivel expirar reservas pendentes:", erro.message);
    });
  }, intervaloExpiracaoPagamentosMs);

  if (typeof intervalo.unref === "function") intervalo.unref();

  expirarReservasPendentes().catch((erro) => {
    console.error("Nao foi possivel expirar reservas pendentes:", erro.message);
  });

  return intervalo;
}
