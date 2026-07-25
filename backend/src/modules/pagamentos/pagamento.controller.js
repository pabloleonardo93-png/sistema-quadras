import executarAssincrono from "../../utils/executarAssincrono.js";
import * as service from "./pagamento.service.js";
import { processarWebhookMercadoPago } from "./webhook.service.js";
import { validarAssinaturaWebhookMercadoPago } from "./providers/mercadoPagoClient.js";

function reservaPublicaParaPagamento(reserva) {
  return {
    id: reserva.id,
    status: reserva.status,
    pagamentoStatus: reserva.pagamentoStatus,
    valorTotal: reserva.valorTotal,
    data: reserva.data,
    horaInicio: reserva.horaInicio,
    horaFim: reserva.horaFim,
    quadra: reserva.quadra ? { id: reserva.quadra.id, nome: reserva.quadra.nome } : null,
    modalidade: reserva.modalidade ? { id: reserva.modalidade.id, nome: reserva.modalidade.nome } : null,
  };
}

export const criarPagamentoMercadoPago = executarAssincrono(async (req, res) => {
  const resultado = await service.criarPagamentoMercadoPago({
    body: req.body,
    emailVerificado: req.emailVerificado,
    enderecoIp: req.ip,
  });
  res.status(201).json({
    mensagem: "Pagamento criado com sucesso.",
    reserva: resultado.reserva,
    checkoutUrl: resultado.checkoutUrl,
    preferenceId: resultado.preferenceId,
    pagamentoExpiraEm: resultado.pagamentoExpiraEm,
    tempoPagamentoMinutos: resultado.tempoPagamentoMinutos,
  });
});

export const criarPixMercadoPago = executarAssincrono(async (req, res) => {
  const resultado = await service.criarPixMercadoPago({
    body: req.body,
    emailVerificado: req.emailVerificado,
    enderecoIp: req.ip,
  });
  res.status(201).json({
    mensagem: "Pix criado com sucesso.",
    reserva: resultado.reserva,
    pix: resultado.pix,
    pagamentoExpiraEm: resultado.pagamentoExpiraEm,
    tempoPagamentoMinutos: resultado.tempoPagamentoMinutos,
  });
});

export const criarCheckoutReserva = executarAssincrono(async (req, res) => {
  const resultado = await service.criarCheckoutDaReserva({
    reservaId: req.params.id,
    emailVerificado: req.emailVerificado,
    exigirComprovacaoDePosse: true,
  });
  res.status(201).json({
    mensagem: "Checkout criado com sucesso.",
    reserva: reservaPublicaParaPagamento(resultado.reserva),
    checkoutUrl: resultado.checkoutUrl,
    preferenceId: resultado.preferenceId,
    pagamentoExpiraEm: resultado.pagamentoExpiraEm,
    tempoPagamentoMinutos: resultado.tempoPagamentoMinutos,
  });
});

export const webhookMercadoPago = executarAssincrono(async (req, res) => {
  const tipo = req.body.type || req.body.topic || req.query.type || req.query.topic;
  const paymentId = req.body.data?.id || req.query["data.id"] || req.query.id;
  if (tipo && tipo !== "payment") {
    return res.status(200).json({ recebido: true, ignorado: true });
  }

  validarAssinaturaWebhookMercadoPago({
    paymentId,
    requestId: req.headers["x-request-id"],
    signature: req.headers["x-signature"],
  });
  const resultado = await processarWebhookMercadoPago({ paymentId });
  return res.status(200).json({ recebido: true, ...resultado });
});
