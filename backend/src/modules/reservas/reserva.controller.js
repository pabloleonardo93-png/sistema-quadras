import { anexarExpiracaoPagamento } from "../../services/mercadoPagoService.js";
import { RESERVA_STATUS } from "../../shared/constants/reservaStatus.js";
import executarAssincrono from "../../utils/executarAssincrono.js";
import * as reservaService from "./reserva.service.js";

export const criar = executarAssincrono(async (req, res) => {
  const reserva = await reservaService.criarReserva({
    ...req.dadosValidados.reserva,
    emailVerificado: req.emailVerificado,
    enderecoIp: req.ip,
  });
  res.status(201).json({ mensagem: "Reserva criada com sucesso.", reserva });
});

export const listar = executarAssincrono(async (req, res) => {
  const reservas = await reservaService.listarReservas(req.dadosValidados.filtrosReservas);
  res.json({ reservas });
});

export const statusPublico = executarAssincrono(async (req, res) => {
  const reserva = await reservaService.buscarReservaPorId(req.dadosValidados.reservaId, {
    mensagemNaoEncontrada: "Reserva nao encontrada.",
  });
  res.json({
    reserva: {
      id: reserva.id,
      status: reserva.status,
      pagamentoStatus: reserva.pagamentoStatus,
      valorTotal: reserva.valorTotal,
      data: reserva.data,
      horaInicio: reserva.horaInicio,
      horaFim: reserva.horaFim,
      quadra: reserva.quadra ? { id: reserva.quadra.id, nome: reserva.quadra.nome } : null,
      modalidade: reserva.modalidade ? { id: reserva.modalidade.id, nome: reserva.modalidade.nome } : null,
      ...anexarExpiracaoPagamento(reserva),
    },
  });
});

export const buscarPorId = executarAssincrono(async (req, res) => {
  const reserva = await reservaService.buscarReservaPorId(req.dadosValidados.reservaId);
  res.json({ reserva });
});

async function mudarStatus(req, res, statusEsperados, novoStatus, mensagem) {
  const reserva = await reservaService.alterarStatusDaReserva({
    id: req.dadosValidados.reservaId,
    statusEsperados,
    novoStatus,
    adminId: req.admin.id,
    enderecoIp: req.ip,
  });
  res.json({ mensagem, reserva });
}

export const confirmar = executarAssincrono(async (req, res) => {
  await mudarStatus(
    req,
    res,
    [RESERVA_STATUS.AGUARDANDO_PAGAMENTO],
    RESERVA_STATUS.CONFIRMADA,
    "Reserva confirmada com sucesso.",
  );
});

export const cancelar = executarAssincrono(async (req, res) => {
  await mudarStatus(
    req,
    res,
    [RESERVA_STATUS.AGUARDANDO_PAGAMENTO, RESERVA_STATUS.CONFIRMADA],
    RESERVA_STATUS.CANCELADA,
    "Reserva cancelada com sucesso.",
  );
});

export const finalizar = executarAssincrono(async (req, res) => {
  await mudarStatus(
    req,
    res,
    [RESERVA_STATUS.CONFIRMADA],
    RESERVA_STATUS.FINALIZADA,
    "Reserva finalizada com sucesso.",
  );
});
