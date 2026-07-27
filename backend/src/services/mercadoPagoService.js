import { createHmac, timingSafeEqual } from "node:crypto";
import { calcularPagamentoExpiraEm, tempoPagamentoMinutos } from "../config/pagamento.js";
import sequelize from "../config/database.js";
import Horario from "../models/Horario.js";
import Reserva from "../models/Reserva.js";
import ErroDaAplicacao from "../utils/ErroDaAplicacao.js";
import { validarEmail, validarId } from "../utils/validacoes.js";
import { dadosExpiracaoPagamento } from "./expiracaoReservaService.js";
import { limitarOperacaoPersistente } from "./limitePersistenteService.js";
import { registrarLog } from "./logService.js";
import { inclusoesReserva } from "./reservaService.js";

const MERCADO_PAGO_API = "https://api.mercadopago.com";
const statusPendentes = new Set(["pending", "in_process", "authorized"]);
const statusCancelados = new Set(["cancelled", "refunded", "charged_back"]);

function accessToken() {
  return process.env.MERCADO_PAGO_ACCESS_TOKEN;
}

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
    return ["localhost", "127.0.0.1", "::1"].includes(new URL(value).hostname);
  } catch {
    return true;
  }
}

function mensagemWebhookInvalido() {
  return new ErroDaAplicacao("Webhook do Mercado Pago invalido.", 401);
}

export function validarAssinaturaWebhookMercadoPago({ paymentId, requestId, signature }) {
  const secret = process.env.MERCADO_PAGO_WEBHOOK_SECRET;
  if (!secret) throw new ErroDaAplicacao("Webhook do Mercado Pago indisponivel.", 503);
  if (!paymentId || !requestId || !signature) throw mensagemWebhookInvalido();

  const partes = Object.fromEntries(
    String(signature)
      .split(",")
      .map((parte) => parte.split("=").map((valor) => valor.trim()))
      .filter(([chave, valor]) => chave && valor),
  );
  if (!partes.ts || !partes.v1) throw mensagemWebhookInvalido();

  const manifest = `id:${paymentId};request-id:${requestId};ts:${partes.ts};`;
  const esperado = createHmac("sha256", secret).update(manifest).digest("hex");
  const esperadoBuffer = Buffer.from(esperado, "hex");
  const recebidoBuffer = Buffer.from(partes.v1, "hex");
  if (esperadoBuffer.length !== recebidoBuffer.length || !timingSafeEqual(esperadoBuffer, recebidoBuffer)) {
    throw mensagemWebhookInvalido();
  }
}

async function chamarMercadoPago(caminho, opcoes = {}) {
  if (!accessToken()) throw new ErroDaAplicacao("Mercado Pago nao configurado.", 503);
  const resposta = await fetch(`${MERCADO_PAGO_API}${caminho}`, {
    ...opcoes,
    headers: { Authorization: `Bearer ${accessToken()}`, "Content-Type": "application/json", ...(opcoes.headers || {}) },
  });
  const texto = await resposta.text();
  let dados = null;
  try { dados = texto ? JSON.parse(texto) : null; } catch { /* resposta invalida do provedor */ }
  if (!resposta.ok) throw new ErroDaAplicacao("Nao foi possivel criar ou consultar o pagamento.", 502);
  return dados || {};
}

function statusPagamentoMercadoPago(status) {
  if (status === "approved") return "aprovado";
  if (statusPendentes.has(status)) return "pendente";
  if (status === "rejected") return "recusado";
  if (status === "refunded" || status === "charged_back") return "estornado";
  if (statusCancelados.has(status) || status === "expired") return "cancelado";
  return "pendente";
}

function valorEmCentavos(valor) {
  const texto = typeof valor === "number" ? valor.toFixed(2) : String(valor ?? "").trim().replace(",", ".");
  const encontrado = texto.match(/^(\d+)(?:\.(\d{1,2}))?$/);
  if (!encontrado) return null;
  const inteiro = Number(encontrado[1]);
  const centavos = Number((encontrado[2] || "").padEnd(2, "0"));
  if (!Number.isSafeInteger(inteiro) || !Number.isSafeInteger(centavos)) return null;
  return inteiro * 100 + centavos;
}

function dadosDoItem(reserva) {
  const valor = Number(reserva.valorTotal || reserva.quadra?.valorHora || 0);
  if (!Number.isFinite(valor) || valor <= 0) throw new ErroDaAplicacao("A reserva nao possui valor valido para pagamento.");
  return {
    id: `reserva-${reserva.id}`,
    title: `Reserva ${reserva.quadra?.nome || "quadra"} - ${reserva.data} ${String(reserva.horaInicio || "").slice(0, 5)}`,
    description: `Reserva de ${reserva.modalidade?.nome || "modalidade"} no Pe na Areia.`,
    quantity: 1,
    currency_id: "BRL",
    unit_price: Number(valor.toFixed(2)),
  };
}

function dadosDoPagador(reserva) {
  const partes = String(reserva.cliente?.nome || "Cliente").trim().split(/\s+/).filter(Boolean);
  const telefone = String(reserva.cliente?.telefone || "").replace(/\D/g, "");
  const payer = { email: reserva.cliente?.email, first_name: partes[0] || "Cliente" };
  if (partes.length > 1) payer.last_name = partes.slice(1).join(" ");
  if (telefone.length >= 10) payer.phone = { area_code: telefone.slice(0, 2), number: telefone.slice(2) };
  return payer;
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

function dadosPixArmazenado(reserva) {
  return {
    pagamentoId: reserva.mercadoPagoPaymentId,
    status: reserva.pagamentoStatus,
    mercadoPagoStatus: reserva.mercadoPagoStatus,
    mercadoPagoStatusDetail: reserva.mercadoPagoStatusDetail,
    qrCode: reserva.pixCopiaECola,
    qrCodeBase64: reserva.pixQrCodeBase64,
    ticketUrl: reserva.pagamentoUrl,
  };
}

function pagamentoExpiraEm(reserva) {
  return reserva.pagamentoExpiraEm || calcularPagamentoExpiraEm(reserva.pagamentoCriadoEm);
}

function tipoDoPagamento(reserva) {
  return reserva.pagamentoTipo || (reserva.mercadoPagoPaymentId ? "pix" : reserva.mercadoPagoPreferenceId ? "checkout" : null);
}

function pagamentoAtivo(reserva) {
  const expiraEm = pagamentoExpiraEm(reserva);
  return reserva.pagamentoStatus === "pendente" && expiraEm && expiraEm > new Date() && tipoDoPagamento(reserva);
}

function dadosReservaPagamento(reserva) {
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

async function carregarReservaDaSessao({ reservaId, email, transaction, lock = false }) {
  const reserva = await Reserva.findByPk(validarId(reservaId, "Reserva"), {
    include: inclusoesReserva,
    transaction,
    lock: lock ? transaction.LOCK.UPDATE : undefined,
  });
  if (!reserva || validarEmail(reserva.cliente?.email || "") !== validarEmail(email)) {
    throw new ErroDaAplicacao("Reserva nao encontrada.", 404);
  }
  return reserva;
}

function validarReservaParaPagamento(reserva) {
  if (["cancelada", "expirada", "finalizada"].includes(reserva.status)) {
    throw new ErroDaAplicacao("Essa reserva nao pode receber pagamento.", 409);
  }
  if (reserva.pagamentoStatus === "aprovado") throw new ErroDaAplicacao("Essa reserva ja esta paga.", 409);
}

function respostaAtiva(reserva, tipo) {
  if (!pagamentoAtivo(reserva)) return null;
  if (tipoDoPagamento(reserva) !== tipo) throw new ErroDaAplicacao("Ja existe um pagamento ativo para esta reserva.", 409);
  const pagamentoExpira = pagamentoExpiraEm(reserva)?.toISOString();
  if (tipo === "checkout" && reserva.pagamentoUrl) {
    return { reserva: dadosReservaPagamento(reserva), checkoutUrl: reserva.pagamentoUrl, preferenceId: reserva.mercadoPagoPreferenceId, pagamentoExpiraEm: pagamentoExpira, tempoPagamentoMinutos, reutilizado: true };
  }
  if (tipo === "pix" && reserva.mercadoPagoPaymentId && reserva.pixCopiaECola) {
    return { reserva: dadosReservaPagamento(reserva), pix: dadosPixArmazenado(reserva), pagamentoExpiraEm: pagamentoExpira, tempoPagamentoMinutos, reutilizado: true };
  }
  throw new ErroDaAplicacao("Ja existe um pagamento ativo para esta reserva.", 409);
}

function chaveIdempotencia(reserva, tipo, tentativa) {
  return `reserva-${reserva.id}-${tipo}-${tentativa}`;
}

export async function criarCheckoutDaReserva({ reservaId, emailVerificado, enderecoIp = null }) {
  return sequelize.transaction(async (transaction) => {
    await limitarOperacaoPersistente({
      operacao: "pagamento",
      identificadores: [{ tipo: "sessao", valor: emailVerificado.verificacaoId }, { tipo: "reserva", valor: reservaId }, ...(enderecoIp ? [{ tipo: "ip", valor: enderecoIp }] : [])],
      transaction,
    });
    const reserva = await carregarReservaDaSessao({ reservaId, email: emailVerificado.email, transaction, lock: true });
    validarReservaParaPagamento(reserva);
    const existente = respostaAtiva(reserva, "checkout");
    if (existente) return existente;

    const tentativa = reserva.pagamentoTentativa + 1;
    const idempotencia = chaveIdempotencia(reserva, "checkout", tentativa);
    const criadoEm = new Date();
    const expiraEm = calcularPagamentoExpiraEm(criadoEm);
    const baseUrl = appPublicUrl();
    const preferenceBody = {
      items: [dadosDoItem(reserva)],
      payer: dadosDoPagador(reserva),
      external_reference: String(reserva.id),
      metadata: { reserva_id: reserva.id, payment_type: "checkout", payment_attempt: tentativa },
      payment_methods: { excluded_payment_methods: [{ id: "pix" }], excluded_payment_types: [{ id: "ticket" }, { id: "bank_transfer" }], installments: 3 },
      expires: true,
      expiration_date_from: criadoEm.toISOString(),
      expiration_date_to: expiraEm.toISOString(),
    };
    if (!isLocalUrl(baseUrl)) {
      preferenceBody.back_urls = { success: `${baseUrl}/pagamento/retorno?status=sucesso&reserva=${reserva.id}`, failure: `${baseUrl}/pagamento/retorno?status=falha&reserva=${reserva.id}`, pending: `${baseUrl}/pagamento/retorno?status=pendente&reserva=${reserva.id}` };
      preferenceBody.auto_return = "approved";
    }
    if (!isLocalUrl(webhookUrl())) preferenceBody.notification_url = webhookUrl();
    const preference = await chamarMercadoPago("/checkout/preferences", { method: "POST", headers: { "X-Idempotency-Key": idempotencia }, body: JSON.stringify(preferenceBody) });
    const checkoutUrl = preference.init_point || preference.sandbox_init_point;
    if (!checkoutUrl) throw new ErroDaAplicacao("Mercado Pago nao retornou URL de checkout.", 502);
    await reserva.update({ pagamentoStatus: "pendente", pagamentoTipo: "checkout", pagamentoTentativa: tentativa, pagamentoIdempotenciaChave: idempotencia, mercadoPagoPreferenceId: preference.id, mercadoPagoPaymentId: null, mercadoPagoStatus: "pending", mercadoPagoStatusDetail: null, pagamentoUrl: checkoutUrl, pagamentoCriadoEm: criadoEm, pagamentoExpiraEm: expiraEm, pixCopiaECola: null, pixQrCodeBase64: null }, { transaction });
    await registrarLog({ acao: "pagamento_criado", entidade: "reserva", entidadeId: reserva.id, detalhes: { tentativa, tipo: "checkout" }, transaction });
    return { reserva: dadosReservaPagamento(reserva), checkoutUrl, preferenceId: preference.id, pagamentoExpiraEm: expiraEm.toISOString(), tempoPagamentoMinutos };
  });
}

export async function criarPixDaReserva({ reservaId, emailVerificado, enderecoIp = null }) {
  return sequelize.transaction(async (transaction) => {
    await limitarOperacaoPersistente({
      operacao: "pagamento",
      identificadores: [{ tipo: "sessao", valor: emailVerificado.verificacaoId }, { tipo: "reserva", valor: reservaId }, ...(enderecoIp ? [{ tipo: "ip", valor: enderecoIp }] : [])],
      transaction,
    });
    const reserva = await carregarReservaDaSessao({ reservaId, email: emailVerificado.email, transaction, lock: true });
    validarReservaParaPagamento(reserva);
    const existente = respostaAtiva(reserva, "pix");
    if (existente) return existente;

    const tentativa = reserva.pagamentoTentativa + 1;
    const idempotencia = chaveIdempotencia(reserva, "pix", tentativa);
    const criadoEm = new Date();
    const expiraEm = calcularPagamentoExpiraEm(criadoEm);
    const item = dadosDoItem(reserva);
    const paymentBody = { transaction_amount: item.unit_price, description: item.title, payment_method_id: "pix", date_of_expiration: expiraEm.toISOString(), external_reference: String(reserva.id), metadata: { reserva_id: reserva.id, payment_type: "pix", payment_attempt: tentativa }, payer: dadosDoPagador(reserva) };
    if (!isLocalUrl(webhookUrl())) paymentBody.notification_url = webhookUrl();
    const pagamento = await chamarMercadoPago("/v1/payments", { method: "POST", headers: { "X-Idempotency-Key": idempotencia }, body: JSON.stringify(paymentBody) });
    const pix = dadosPixDoPagamento(pagamento);
    if (!pix.qrCode && !pix.qrCodeBase64 && !pix.ticketUrl) throw new ErroDaAplicacao("Mercado Pago nao retornou os dados do Pix.", 502);
    await reserva.update({ pagamentoStatus: pix.status, pagamentoTipo: "pix", pagamentoTentativa: tentativa, pagamentoIdempotenciaChave: idempotencia, mercadoPagoPreferenceId: null, mercadoPagoPaymentId: pix.pagamentoId, mercadoPagoStatus: pix.mercadoPagoStatus, mercadoPagoStatusDetail: pix.mercadoPagoStatusDetail, pagamentoUrl: pix.ticketUrl, pagamentoCriadoEm: criadoEm, pagamentoExpiraEm: expiraEm, pixCopiaECola: pix.qrCode, pixQrCodeBase64: pix.qrCodeBase64 }, { transaction });
    await registrarLog({ acao: "pix_criado", entidade: "reserva", entidadeId: reserva.id, detalhes: { tentativa, tipo: "pix" }, transaction });
    return { reserva: dadosReservaPagamento(reserva), pix, pagamentoExpiraEm: expiraEm.toISOString(), tempoPagamentoMinutos };
  });
}

export async function buscarPagamentoMercadoPago(paymentId) {
  return chamarMercadoPago(`/v1/payments/${encodeURIComponent(paymentId)}`);
}

function webhookConfereComReserva({ pagamento, reserva }) {
  const reservaId = String(reserva.id);
  if (String(pagamento.external_reference || "") !== reservaId) return false;
  if (String(pagamento.metadata?.reserva_id || "") !== reservaId) return false;
  if (String(pagamento.currency_id || "").toUpperCase() !== "BRL") return false;
  if (valorEmCentavos(pagamento.transaction_amount) !== valorEmCentavos(reserva.valorTotal)) return false;
  const tipo = tipoDoPagamento(reserva);
  if (!tipo || String(pagamento.metadata?.payment_type || "") !== tipo) return false;
  if (Number(pagamento.metadata?.payment_attempt) !== Number(reserva.pagamentoTentativa)) return false;
  if (tipo === "pix") return pagamento.payment_method_id === "pix" && String(pagamento.id) === String(reserva.mercadoPagoPaymentId);
  return pagamento.payment_method_id !== "pix" && String(pagamento.preference_id || "") === String(reserva.mercadoPagoPreferenceId || "");
}

export async function processarWebhookMercadoPago({ paymentId }) {
  if (!paymentId) return { processado: false };
  const pagamento = await buscarPagamentoMercadoPago(paymentId);
  const referencia = String(pagamento.external_reference || "");
  if (!/^\d+$/.test(referencia)) return { processado: false };

  return sequelize.transaction(async (transaction) => {
    const reserva = await Reserva.findByPk(Number(referencia), { include: inclusoesReserva, transaction, lock: transaction.LOCK.UPDATE });
    if (!reserva || !webhookConfereComReserva({ pagamento, reserva })) return { processado: false };
    if (["cancelada", "expirada", "finalizada"].includes(reserva.status)) return { processado: false };

    const pagamentoStatus = statusPagamentoMercadoPago(pagamento.status);
    if (reserva.pagamentoStatus === "aprovado" && pagamentoStatus !== "aprovado") return { processado: true, pagamentoStatus: "aprovado" };

    const atualizacao = { pagamentoStatus, mercadoPagoStatus: pagamento.status, mercadoPagoStatusDetail: pagamento.status_detail || null };
    if (pagamentoStatus === "aprovado") {
      atualizacao.pagoEm = pagamento.date_approved ? new Date(pagamento.date_approved) : new Date();
      if (reserva.status === "aguardando_pagamento") atualizacao.status = "confirmada";
    } else if ((pagamento.status === "expired" || ["cancelado", "recusado", "estornado"].includes(pagamentoStatus)) && reserva.status === "aguardando_pagamento") {
      atualizacao.status = pagamento.status === "expired" ? "expirada" : "cancelada";
    }
    await reserva.update(atualizacao, { transaction });
    if (["cancelada", "expirada"].includes(atualizacao.status)) {
      await Horario.update({ status: "disponivel" }, { where: { id: reserva.horarioId }, transaction });
    }
    await registrarLog({ acao: "pagamento_atualizado", entidade: "reserva", entidadeId: reserva.id, detalhes: { paymentId: String(pagamento.id), pagamentoStatus }, transaction });
    return { processado: true, pagamentoStatus };
  });
}

export function anexarExpiracaoPagamento(reserva) {
  return { ...dadosExpiracaoPagamento(reserva), tempoPagamentoMinutos };
}

export { dadosReservaPagamento, valorEmCentavos, webhookConfereComReserva };
