import { registrarLog } from "../../services/logService.js";
import {
  PAGAMENTO_STATUS,
  PAGAMENTO_STATUS_ENCERRADOS_SEM_APROVACAO,
} from "../../shared/constants/pagamentoStatus.js";
import { RESERVA_STATUS } from "../../shared/constants/reservaStatus.js";
import { HORARIO_STATUS } from "../../shared/constants/statusAdministrativos.js";
import * as repository from "./pagamento.repository.js";
import { statusPagamentoMercadoPago } from "./pagamento.service.js";
import * as mercadoPagoClient from "./providers/mercadoPagoClient.js";

function jaProcessado(reserva, pagamento, pagamentoStatus) {
  return reserva.mercadoPagoPaymentId === String(pagamento.id)
    && reserva.mercadoPagoStatus === pagamento.status
    && reserva.mercadoPagoStatusDetail === (pagamento.status_detail || null)
    && reserva.pagamentoStatus === pagamentoStatus;
}

export function buscarPagamentoMercadoPago(paymentId) {
  return mercadoPagoClient.buscarPagamento(paymentId);
}

export async function processarWebhookMercadoPago({ paymentId }) {
  if (!paymentId) return { processado: false, motivo: "Pagamento nao informado." };

  const pagamento = await buscarPagamentoMercadoPago(paymentId);
  const reservaId = pagamento.external_reference || pagamento.metadata?.reserva_id;
  const where = reservaId
    ? { id: Number(reservaId) }
    : { mercadoPagoPreferenceId: pagamento.preference_id };

  return repository.executarEmTransacao(async (transaction) => {
    const reserva = await repository.buscarReservaParaWebhook({ where, transaction });
    if (!reserva) return { processado: false, motivo: "Reserva nao encontrada." };

    const pagamentoStatus = statusPagamentoMercadoPago(pagamento.status);
    if (jaProcessado(reserva, pagamento, pagamentoStatus)) {
      return { processado: true, reservaId: reserva.id, pagamentoStatus };
    }

    const atualizacao = {
      pagamentoStatus,
      mercadoPagoPaymentId: String(pagamento.id),
      mercadoPagoStatus: pagamento.status,
      mercadoPagoStatusDetail: pagamento.status_detail || null,
    };
    if (pagamentoStatus === PAGAMENTO_STATUS.APROVADO) {
      atualizacao.pagoEm = pagamento.date_approved ? new Date(pagamento.date_approved) : new Date();
      if (reserva.status === RESERVA_STATUS.AGUARDANDO_PAGAMENTO) {
        atualizacao.status = RESERVA_STATUS.CONFIRMADA;
      }
    }
    if (pagamento.status === "expired" && reserva.status !== RESERVA_STATUS.FINALIZADA) {
      atualizacao.status = RESERVA_STATUS.EXPIRADA;
    }
    if (
      PAGAMENTO_STATUS_ENCERRADOS_SEM_APROVACAO.includes(pagamentoStatus)
      && reserva.status !== RESERVA_STATUS.FINALIZADA
    ) {
      atualizacao.status = pagamento.status === "expired"
        ? RESERVA_STATUS.EXPIRADA
        : RESERVA_STATUS.CANCELADA;
    }

    await repository.atualizarReserva(reserva, atualizacao, transaction);
    if (
      atualizacao.status === RESERVA_STATUS.CANCELADA
      || atualizacao.status === RESERVA_STATUS.EXPIRADA
    ) {
      await repository.liberarHorario(reserva.horarioId, HORARIO_STATUS.DISPONIVEL, transaction);
    }
    await registrarLog({
      acao: "pagamento_atualizado",
      entidade: "reserva",
      entidadeId: reserva.id,
      detalhes: {
        paymentId: pagamento.id,
        mercadoPagoStatus: pagamento.status,
        pagamentoStatus,
      },
      transaction,
    });
    return { processado: true, reservaId: reserva.id, pagamentoStatus };
  });
}
