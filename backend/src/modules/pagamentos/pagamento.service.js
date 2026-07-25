import { randomUUID } from "node:crypto";
import { calcularPagamentoExpiraEm, tempoPagamentoMinutos } from "../../config/pagamento.js";
import { criarOuAtualizarClienteValidado } from "../../services/clienteService.js";
import { registrarLog } from "../../services/logService.js";
import { alterarStatusDaReserva, criarReserva } from "../../services/reservaService.js";
import {
  PAGAMENTO_STATUS,
} from "../../shared/constants/pagamentoStatus.js";
import {
  RESERVA_STATUS,
  RESERVA_STATUS_BLOQUEIAM_PAGAMENTO,
} from "../../shared/constants/reservaStatus.js";
import ErroDaAplicacao from "../../utils/ErroDaAplicacao.js";
import { validarEmail, validarId } from "../../utils/validacoes.js";
import { dadosExpiracaoPagamento } from "../reservas/expiracaoReserva.service.js";
import * as repository from "./pagamento.repository.js";
import * as mercadoPagoClient from "./providers/mercadoPagoClient.js";

function appPublicUrl() {
  return String(process.env.APP_PUBLIC_URL || "http://localhost:5173").replace(/\/$/, "");
}

function apiPublicUrl() {
  return String(process.env.API_PUBLIC_URL || "http://localhost:3000").replace(/\/$/, "");
}

function webhookUrl() {
  return process.env.MERCADO_PAGO_WEBHOOK_URL || `${apiPublicUrl()}/api/webhooks/mercadopago`;
}

function isLocalUrl(value) {
  try {
    const url = new URL(value);
    return ["localhost", "127.0.0.1", "::1"].includes(url.hostname);
  } catch {
    return true;
  }
}

function dadosDoItem(reserva) {
  const valor = Number(reserva.valorTotal || reserva.quadra?.valorHora || 0);
  if (!Number.isFinite(valor) || valor <= 0) {
    throw new ErroDaAplicacao("A reserva nao possui valor valido para pagamento.");
  }

  const hora = String(reserva.horaInicio || "").slice(0, 5);
  return {
    id: `reserva-${reserva.id}`,
    title: `Reserva ${reserva.quadra?.nome || "quadra"} - ${reserva.data} ${hora}`,
    description: `Reserva de ${reserva.modalidade?.nome || "modalidade"} no Pe na Areia.`,
    quantity: 1,
    currency_id: "BRL",
    unit_price: Number(valor.toFixed(2)),
  };
}

function separarNome(nome = "") {
  const partes = String(nome || "").trim().split(/\s+/).filter(Boolean);
  const [primeiroNome = "Cliente", ...sobrenomes] = partes;
  return {
    primeiroNome,
    sobrenome: sobrenomes.join(" "),
  };
}

function apenasDigitos(valor = "") {
  return String(valor || "").replace(/\D/g, "");
}

function dadosDoPagador(reserva) {
  const { primeiroNome, sobrenome } = separarNome(reserva.cliente?.nome);
  const telefone = apenasDigitos(reserva.cliente?.telefone);
  const payer = {
    email: reserva.cliente?.email,
    first_name: primeiroNome,
  };

  if (sobrenome) payer.last_name = sobrenome;
  if (telefone.length >= 10) {
    payer.phone = {
      area_code: telefone.slice(0, 2),
      number: telefone.slice(2),
    };
  }

  return payer;
}

export function statusPagamentoMercadoPago(status) {
  const statusPendentes = new Set(["pending", "in_process", "authorized"]);
  const statusCancelados = new Set(["cancelled", "refunded", "charged_back"]);
  if (status === "approved") return PAGAMENTO_STATUS.APROVADO;
  if (statusPendentes.has(status)) return PAGAMENTO_STATUS.PENDENTE;
  if (status === "rejected") return PAGAMENTO_STATUS.RECUSADO;
  if (status === "refunded" || status === "charged_back") return PAGAMENTO_STATUS.ESTORNADO;
  if (statusCancelados.has(status) || status === "expired") return PAGAMENTO_STATUS.CANCELADO;
  return PAGAMENTO_STATUS.PENDENTE;
}

function dadosPixDoPagamento(pagamento) {
  const transactionData = pagamento.point_of_interaction?.transaction_data || {};
  return {
    pagamentoId: String(pagamento.id),
    status: statusPagamentoMercadoPago(pagamento.status),
    mercadoPagoStatus: pagamento.status,
    mercadoPagoStatusDetail: pagamento.status_detail || null,
    qrCode: transactionData.qr_code || null,
    qrCodeBase64: transactionData.qr_code_base64 || null,
    ticketUrl: transactionData.ticket_url || null,
  };
}

function validarReservaParaPagamento(reserva) {
  if (!reserva) throw new ErroDaAplicacao("Reserva nao encontrada.", 404);
  if (RESERVA_STATUS_BLOQUEIAM_PAGAMENTO.includes(reserva.status)) {
    throw new ErroDaAplicacao("Essa reserva nao pode receber pagamento.", 409);
  }
}

function validarComprovacaoDePosseDaReserva(reserva, emailVerificado) {
  const emailDaReserva = reserva?.cliente?.email ? validarEmail(reserva.cliente.email) : "";
  const emailDaSessao = emailVerificado?.email ? validarEmail(emailVerificado.email) : "";
  if (!emailDaReserva || !emailDaSessao || emailDaReserva !== emailDaSessao) {
    throw new ErroDaAplicacao("Valide o e-mail vinculado a reserva antes de continuar.", 403);
  }
}

export async function criarCheckoutDaReserva({
  reservaId,
  emailVerificado = null,
  exigirComprovacaoDePosse = false,
}) {
  const reserva = await repository.buscarReservaParaPagamento(validarId(reservaId, "Reserva"));
  validarReservaParaPagamento(reserva);
  if (exigirComprovacaoDePosse) validarComprovacaoDePosseDaReserva(reserva, emailVerificado);
  if (reserva.pagamentoStatus === PAGAMENTO_STATUS.APROVADO) {
    return { reserva, checkoutUrl: reserva.pagamentoUrl, preferenceId: reserva.mercadoPagoPreferenceId };
  }

  const baseUrl = appPublicUrl();
  const publicBaseUrl = !isLocalUrl(baseUrl);
  const publicWebhookUrl = webhookUrl();
  const hasPublicWebhookUrl = !isLocalUrl(publicWebhookUrl);
  const pagamentoCriadoEm = new Date();
  const pagamentoExpiraEm = calcularPagamentoExpiraEm(pagamentoCriadoEm);
  const preferenceBody = {
    items: [dadosDoItem(reserva)],
    payer: {
      name: reserva.cliente?.nome,
      email: reserva.cliente?.email,
      phone: { number: reserva.cliente?.telefone },
    },
    external_reference: String(reserva.id),
    metadata: { reserva_id: reserva.id },
    payment_methods: {
      excluded_payment_methods: [{ id: "pix" }],
      excluded_payment_types: [{ id: "ticket" }, { id: "bank_transfer" }],
      installments: 3,
    },
    expires: true,
    expiration_date_from: pagamentoCriadoEm.toISOString(),
    expiration_date_to: pagamentoExpiraEm.toISOString(),
  };

  if (publicBaseUrl) {
    preferenceBody.back_urls = {
      success: `${baseUrl}/pagamento/retorno?status=sucesso&reserva=${reserva.id}`,
      failure: `${baseUrl}/pagamento/retorno?status=falha&reserva=${reserva.id}`,
      pending: `${baseUrl}/pagamento/retorno?status=${PAGAMENTO_STATUS.PENDENTE}&reserva=${reserva.id}`,
    };
    preferenceBody.auto_return = "approved";
  }

  if (hasPublicWebhookUrl) preferenceBody.notification_url = publicWebhookUrl;

  const preference = await mercadoPagoClient.criarCheckout({
    method: "POST",
    headers: { "X-Idempotency-Key": `reserva-${reserva.id}-${randomUUID()}` },
    body: JSON.stringify(preferenceBody),
  });
  const checkoutUrl = preference.init_point || preference.sandbox_init_point;
  if (!checkoutUrl) throw new ErroDaAplicacao("Mercado Pago nao retornou URL de checkout.", 502);

  await repository.atualizarReserva(reserva, {
    pagamentoStatus: PAGAMENTO_STATUS.PENDENTE,
    mercadoPagoPreferenceId: preference.id,
    pagamentoUrl: checkoutUrl,
    pagamentoCriadoEm,
  });
  await registrarLog({
    acao: "pagamento_criado",
    entidade: "reserva",
    entidadeId: reserva.id,
    detalhes: { preferenceId: preference.id, valorTotal: reserva.valorTotal },
  });

  const reservaAtualizada = await repository.buscarReservaAtualizada(reserva.id);
  return {
    reserva: reservaAtualizada,
    checkoutUrl,
    preferenceId: preference.id,
    pagamentoExpiraEm: pagamentoExpiraEm.toISOString(),
    tempoPagamentoMinutos,
  };
}

export async function criarPixDaReserva({
  reservaId,
  emailVerificado = null,
  exigirComprovacaoDePosse = false,
}) {
  const reserva = await repository.buscarReservaParaPagamento(validarId(reservaId, "Reserva"));
  validarReservaParaPagamento(reserva);
  if (exigirComprovacaoDePosse) validarComprovacaoDePosseDaReserva(reserva, emailVerificado);
  if (reserva.pagamentoStatus === PAGAMENTO_STATUS.APROVADO) {
    throw new ErroDaAplicacao("Essa reserva ja esta paga.", 409);
  }

  const item = dadosDoItem(reserva);
  const publicWebhookUrl = webhookUrl();
  const hasPublicWebhookUrl = !isLocalUrl(publicWebhookUrl);
  const pagamentoCriadoEm = new Date();
  const pagamentoExpiraEm = calcularPagamentoExpiraEm(pagamentoCriadoEm);
  const paymentBody = {
    transaction_amount: item.unit_price,
    description: item.title,
    payment_method_id: "pix",
    date_of_expiration: pagamentoExpiraEm.toISOString(),
    external_reference: String(reserva.id),
    metadata: { reserva_id: reserva.id },
    payer: dadosDoPagador(reserva),
  };

  if (hasPublicWebhookUrl) paymentBody.notification_url = publicWebhookUrl;
  const pagamento = await mercadoPagoClient.criarPix({
    method: "POST",
    headers: { "X-Idempotency-Key": `reserva-pix-${reserva.id}-${randomUUID()}` },
    body: JSON.stringify(paymentBody),
  });
  const pix = dadosPixDoPagamento(pagamento);
  if (!pix.qrCode && !pix.qrCodeBase64 && !pix.ticketUrl) {
    throw new ErroDaAplicacao("Mercado Pago nao retornou os dados do Pix.", 502);
  }

  await repository.atualizarReserva(reserva, {
    pagamentoStatus: pix.status,
    mercadoPagoPaymentId: pix.pagamentoId,
    mercadoPagoStatus: pix.mercadoPagoStatus,
    mercadoPagoStatusDetail: pix.mercadoPagoStatusDetail,
    pagamentoUrl: pix.ticketUrl,
    pagamentoCriadoEm,
  });
  await registrarLog({
    acao: "pix_criado",
    entidade: "reserva",
    entidadeId: reserva.id,
    detalhes: {
      paymentId: pix.pagamentoId,
      mercadoPagoStatus: pix.mercadoPagoStatus,
      valorTotal: reserva.valorTotal,
    },
  });

  const reservaAtualizada = await repository.buscarReservaAtualizada(reserva.id);
  return {
    reserva: reservaAtualizada,
    pix,
    pagamentoExpiraEm: pagamentoExpiraEm.toISOString(),
    tempoPagamentoMinutos,
  };
}

async function obterOuCriarReservaParaPagamento({ body, emailVerificado, enderecoIp }) {
  const reservaId = body.reservaId || body.reserva_id;
  const criouReservaNesteFluxo = !reservaId;
  let reserva = reservaId ? { id: reservaId } : null;

  if (!reserva) {
    const cliente = await criarOuAtualizarClienteValidado({
      nome: body.nome,
      telefone: body.telefone,
      email: emailVerificado.email,
      validadoEm: emailVerificado.validadoEm,
      enderecoIp,
    });
    reserva = await criarReserva({
      clienteId: cliente.id,
      quadraId: body.quadraId || body.quadra_id,
      modalidadeId: body.modalidadeId || body.modalidade_id,
      horarioId: body.horarioId || body.horario_id,
      observacoes: body.observacoes,
      emailVerificado,
      enderecoIp,
    });
  }
  return { reserva, criouReservaNesteFluxo };
}

async function cancelarReservaCriadaNoFluxo({ reserva, criouReservaNesteFluxo, enderecoIp }) {
  if (!criouReservaNesteFluxo || !reserva?.id) return;
  await alterarStatusDaReserva({
    id: reserva.id,
    statusEsperados: [RESERVA_STATUS.AGUARDANDO_PAGAMENTO],
    novoStatus: RESERVA_STATUS.CANCELADA,
    adminId: null,
    enderecoIp,
  }).catch(() => {});
}

async function criarPagamentoNoFluxo({ body, emailVerificado, enderecoIp, criarPagamento }) {
  mercadoPagoClient.garantirMercadoPagoConfigurado();
  let reserva = null;
  let criouReservaNesteFluxo = false;
  try {
    ({ reserva, criouReservaNesteFluxo } = await obterOuCriarReservaParaPagamento({
      body,
      emailVerificado,
      enderecoIp,
    }));
    return await criarPagamento({
      reservaId: reserva.id,
      emailVerificado,
      exigirComprovacaoDePosse: Boolean(body.reservaId || body.reserva_id),
    });
  } catch (erro) {
    await cancelarReservaCriadaNoFluxo({ reserva, criouReservaNesteFluxo, enderecoIp });
    throw erro;
  }
}

export function criarPagamentoMercadoPago(dados) {
  return criarPagamentoNoFluxo({ ...dados, criarPagamento: criarCheckoutDaReserva });
}

export function criarPixMercadoPago(dados) {
  return criarPagamentoNoFluxo({ ...dados, criarPagamento: criarPixDaReserva });
}

export function anexarExpiracaoPagamento(reserva) {
  return {
    ...dadosExpiracaoPagamento(reserva),
    tempoPagamentoMinutos,
  };
}
