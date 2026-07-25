import {
  calcularCorteExpiracao,
  calcularPagamentoExpiraEm,
  intervaloExpiracaoPagamentosMs,
} from "../../config/pagamento.js";
import { PAGAMENTO_STATUS } from "../../shared/constants/pagamentoStatus.js";
import { RESERVA_STATUS } from "../../shared/constants/reservaStatus.js";
import { HORARIO_STATUS } from "../../shared/constants/statusAdministrativos.js";
import { registrarLog } from "../../services/logService.js";
import * as repository from "./reserva.repository.js";

export function dadosExpiracaoPagamento(reserva) {
  const pagamentoExpiraEm = calcularPagamentoExpiraEm(reserva?.pagamentoCriadoEm);
  return {
    pagamentoExpiraEm: pagamentoExpiraEm?.toISOString() || null,
  };
}

export async function expirarReservasPendentes({ agora = new Date(), limite = 100 } = {}) {
  const corte = calcularCorteExpiracao(agora);
  if (!corte) return { expiradas: 0 };

  return repository.executarEmTransacao(async (transaction) => {
    const reservas = await repository.listarReservasPendentesParaExpirar({
      corte,
      limite,
      transaction,
    });

    for (const reserva of reservas) {
      await repository.atualizarReserva(reserva, {
        status: RESERVA_STATUS.EXPIRADA,
        pagamentoStatus: PAGAMENTO_STATUS.CANCELADO,
      }, transaction);

      await repository.atualizarHorarioStatus(reserva.horarioId, HORARIO_STATUS.DISPONIVEL, transaction);

      await registrarLog({
        acao: "reserva_expirada",
        entidade: "reserva",
        entidadeId: reserva.id,
        detalhes: {
          motivo: "pagamento_nao_aprovado_no_prazo",
          pagamentoCriadoEm: reserva.pagamentoCriadoEm,
          pagamentoExpiraEm: calcularPagamentoExpiraEm(reserva.pagamentoCriadoEm)?.toISOString() || null,
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
