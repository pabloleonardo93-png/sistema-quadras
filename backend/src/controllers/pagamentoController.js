import {
  criarCheckoutDaReserva,
  criarPixDaReserva,
  processarWebhookMercadoPago,
  validarAssinaturaWebhookMercadoPago,
} from "../services/mercadoPagoService.js";
import { criarOuAtualizarClienteValidado } from "../services/clienteService.js";
import { alterarStatusDaReserva, criarReserva } from "../services/reservaService.js";
import ErroDaAplicacao from "../utils/ErroDaAplicacao.js";
import executarAssincrono from "../utils/executarAssincrono.js";

async function obterOuCriarReservaParaPagamento(req) {
  const reservaId = req.body.reservaId || req.body.reserva_id;
  const criouReservaNesteFluxo = !reservaId;
  let reserva = reservaId ? { id: reservaId } : null;

  if (!reserva) {
    const cliente = await criarOuAtualizarClienteValidado({
      nome: req.body.nome,
      telefone: req.body.telefone,
      email: req.emailVerificado.email,
      validadoEm: req.emailVerificado.validadoEm,
      enderecoIp: req.ip,
    });

    reserva = await criarReserva({
      clienteId: cliente.id,
      quadraId: req.body.quadraId || req.body.quadra_id,
      modalidadeId: req.body.modalidadeId || req.body.modalidade_id,
      horarioId: req.body.horarioId || req.body.horario_id,
      observacoes: req.body.observacoes,
      emailVerificado: req.emailVerificado,
      enderecoIp: req.ip,
    });
  }

  return { reserva, criouReservaNesteFluxo };
}

async function cancelarReservaCriadaNoFluxo({ req, reserva, criouReservaNesteFluxo }) {
  if (!criouReservaNesteFluxo || !reserva?.id) return;

  await alterarStatusDaReserva({
    id: reserva.id,
    statusEsperados: ["aguardando_pagamento"],
    novoStatus: "cancelada",
    adminId: null,
    enderecoIp: req.ip,
  }).catch(() => {});
}

export const criarPagamentoMercadoPago = executarAssincrono(async (req, res) => {
  if (!process.env.MERCADO_PAGO_ACCESS_TOKEN) {
    throw new ErroDaAplicacao("Mercado Pago nao configurado. Defina MERCADO_PAGO_ACCESS_TOKEN no backend.", 503);
  }

  let reserva = null;
  let criouReservaNesteFluxo = false;

  try {
    ({ reserva, criouReservaNesteFluxo } = await obterOuCriarReservaParaPagamento(req));

    const resultado = await criarCheckoutDaReserva({ reservaId: reserva.id });
    res.status(201).json({
      mensagem: "Pagamento criado com sucesso.",
      reserva: resultado.reserva,
      checkoutUrl: resultado.checkoutUrl,
      preferenceId: resultado.preferenceId,
      pagamentoExpiraEm: resultado.pagamentoExpiraEm,
      tempoPagamentoMinutos: resultado.tempoPagamentoMinutos,
    });
  } catch (erro) {
    await cancelarReservaCriadaNoFluxo({ req, reserva, criouReservaNesteFluxo });
    throw erro;
  }
});

export const criarPixMercadoPago = executarAssincrono(async (req, res) => {
  if (!process.env.MERCADO_PAGO_ACCESS_TOKEN) {
    throw new ErroDaAplicacao("Mercado Pago nao configurado. Defina MERCADO_PAGO_ACCESS_TOKEN no backend.", 503);
  }

  let reserva = null;
  let criouReservaNesteFluxo = false;

  try {
    ({ reserva, criouReservaNesteFluxo } = await obterOuCriarReservaParaPagamento(req));

    const resultado = await criarPixDaReserva({ reservaId: reserva.id });
    res.status(201).json({
      mensagem: "Pix criado com sucesso.",
      reserva: resultado.reserva,
      pix: resultado.pix,
      pagamentoExpiraEm: resultado.pagamentoExpiraEm,
      tempoPagamentoMinutos: resultado.tempoPagamentoMinutos,
    });
  } catch (erro) {
    await cancelarReservaCriadaNoFluxo({ req, reserva, criouReservaNesteFluxo });
    throw erro;
  }
});

export const criarCheckoutReserva = executarAssincrono(async (req, res) => {
  const resultado = await criarCheckoutDaReserva({ reservaId: req.params.id });
  res.status(201).json({
    mensagem: "Checkout criado com sucesso.",
    reserva: resultado.reserva,
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
