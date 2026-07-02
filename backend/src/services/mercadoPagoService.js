import { createHmac, randomUUID, timingSafeEqual } from "node:crypto";
import sequelize from "../config/database.js";
import Horario from "../models/Horario.js";
import Reserva from "../models/Reserva.js";
import ErroDaAplicacao from "../utils/ErroDaAplicacao.js";
import { validarId } from "../utils/validacoes.js";
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
    const url = new URL(value);
    return ["localhost", "127.0.0.1", "::1"].includes(url.hostname);
  } catch {
    return true;
  }
}

export function validarAssinaturaWebhookMercadoPago({ paymentId, requestId, signature }) {
  const secret = process.env.MERCADO_PAGO_WEBHOOK_SECRET;
  if (!secret) return;

  if (!paymentId || !requestId || !signature) {
    throw new ErroDaAplicacao("Webhook do Mercado Pago sem assinatura valida.", 401);
  }

  const partes = Object.fromEntries(
    String(signature)
      .split(",")
      .map((parte) => parte.split("=").map((valor) => valor.trim()))
      .filter(([chave, valor]) => chave && valor),
  );

  if (!partes.ts || !partes.v1) {
    throw new ErroDaAplicacao("Assinatura do Mercado Pago incompleta.", 401);
  }

  const manifest = `id:${paymentId};request-id:${requestId};ts:${partes.ts};`;
  const esperado = createHmac("sha256", secret).update(manifest).digest("hex");
  const recebido = partes.v1;
  const esperadoBuffer = Buffer.from(esperado, "hex");
  const recebidoBuffer = Buffer.from(recebido, "hex");

  if (
    esperadoBuffer.length !== recebidoBuffer.length ||
    !timingSafeEqual(esperadoBuffer, recebidoBuffer)
  ) {
    throw new ErroDaAplicacao("Assinatura do Mercado Pago invalida.", 401);
  }
}

async function chamarMercadoPago(path, options = {}) {
  if (!accessToken()) {
    throw new ErroDaAplicacao("Mercado Pago nao configurado. Defina MERCADO_PAGO_ACCESS_TOKEN no backend.", 503);
  }

  const response = await fetch(`${MERCADO_PAGO_API}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${accessToken()}`,
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });

  const text = await response.text();
  const data = text ? JSON.parse(text) : null;
  if (!response.ok) {
    const causas = Array.isArray(data?.cause)
      ? data.cause.map((causa) => causa.description || causa.message).filter(Boolean).join(" ")
      : "";
    const mensagem = data?.message || data?.error || causas || "Nao foi possivel comunicar com o Mercado Pago.";
    const mensagemAmigavel = /Unauthorized use of live credentials/i.test(mensagem)
      ? "Mercado Pago recusou a credencial atual para gerar Pix. Confira se o Access Token e do ambiente correto e se a conta vendedora tem chave Pix cadastrada."
      : mensagem;

    throw new ErroDaAplicacao(
      mensagemAmigavel,
      response.status >= 500 ? 502 : response.status,
    );
  }
  return data;
}

function statusPagamentoMercadoPago(status) {
  if (status === "approved") return "aprovado";
  if (statusPendentes.has(status)) return "pendente";
  if (status === "rejected") return "recusado";
  if (status === "refunded" || status === "charged_back") return "estornado";
  if (statusCancelados.has(status) || status === "expired") return "cancelado";
  return "pendente";
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

export async function criarCheckoutDaReserva({ reservaId }) {
  const reserva = await Reserva.findByPk(validarId(reservaId, "Reserva"), {
    include: inclusoesReserva,
  });

  if (!reserva) throw new ErroDaAplicacao("Reserva nao encontrada.", 404);
  if (reserva.status === "cancelada" || reserva.status === "expirada" || reserva.status === "finalizada") {
    throw new ErroDaAplicacao("Essa reserva nao pode receber pagamento.", 409);
  }
  if (reserva.pagamentoStatus === "aprovado") {
    return { reserva, checkoutUrl: reserva.pagamentoUrl, preferenceId: reserva.mercadoPagoPreferenceId };
  }

  const baseUrl = appPublicUrl();
  const publicBaseUrl = !isLocalUrl(baseUrl);
  const publicWebhookUrl = webhookUrl();
  const hasPublicWebhookUrl = !isLocalUrl(publicWebhookUrl);
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
      installments: 3,
    },
  };

  if (publicBaseUrl) {
    preferenceBody.back_urls = {
      success: `${baseUrl}/pagamento/retorno?status=sucesso&reserva=${reserva.id}`,
      failure: `${baseUrl}/pagamento/retorno?status=falha&reserva=${reserva.id}`,
      pending: `${baseUrl}/pagamento/retorno?status=pendente&reserva=${reserva.id}`,
    };
    preferenceBody.auto_return = "approved";
  }

  if (hasPublicWebhookUrl) {
    preferenceBody.notification_url = publicWebhookUrl;
  }

  const preference = await chamarMercadoPago("/checkout/preferences", {
    method: "POST",
    headers: { "X-Idempotency-Key": `reserva-${reserva.id}-${randomUUID()}` },
    body: JSON.stringify(preferenceBody),
  });

  const checkoutUrl = preference.init_point || preference.sandbox_init_point;
  if (!checkoutUrl) {
    throw new ErroDaAplicacao("Mercado Pago nao retornou URL de checkout.", 502);
  }

  await reserva.update({
    pagamentoStatus: "pendente",
    mercadoPagoPreferenceId: preference.id,
    pagamentoUrl: checkoutUrl,
    pagamentoCriadoEm: new Date(),
  });

  await registrarLog({
    acao: "pagamento_criado",
    entidade: "reserva",
    entidadeId: reserva.id,
    detalhes: { preferenceId: preference.id, valorTotal: reserva.valorTotal },
  });

  const reservaAtualizada = await Reserva.findByPk(reserva.id, { include: inclusoesReserva });
  return { reserva: reservaAtualizada, checkoutUrl, preferenceId: preference.id };
}

export async function buscarPagamentoMercadoPago(paymentId) {
  return chamarMercadoPago(`/v1/payments/${encodeURIComponent(paymentId)}`);
}

export async function processarWebhookMercadoPago({ paymentId }) {
  if (!paymentId) return { processado: false, motivo: "Pagamento nao informado." };

  const pagamento = await buscarPagamentoMercadoPago(paymentId);
  const reservaId = pagamento.external_reference || pagamento.metadata?.reserva_id;
  const where = reservaId
    ? { id: Number(reservaId) }
    : { mercadoPagoPreferenceId: pagamento.preference_id };

  return sequelize.transaction(async (transaction) => {
    const reserva = await Reserva.findOne({
      where,
      include: inclusoesReserva,
      transaction,
      lock: transaction.LOCK.UPDATE,
    });

    if (!reserva) return { processado: false, motivo: "Reserva nao encontrada." };

    const pagamentoStatus = statusPagamentoMercadoPago(pagamento.status);
    const atualizacao = {
      pagamentoStatus,
      mercadoPagoPaymentId: String(pagamento.id),
      mercadoPagoStatus: pagamento.status,
      mercadoPagoStatusDetail: pagamento.status_detail || null,
    };

    if (pagamentoStatus === "aprovado") {
      atualizacao.pagoEm = pagamento.date_approved ? new Date(pagamento.date_approved) : new Date();
      if (reserva.status !== "finalizada") atualizacao.status = "confirmada";
    }

    if (pagamento.status === "expired" && reserva.status !== "finalizada") {
      atualizacao.status = "expirada";
    }

    if (["cancelado", "recusado", "estornado"].includes(pagamentoStatus) && reserva.status !== "finalizada") {
      atualizacao.status = pagamento.status === "expired" ? "expirada" : "cancelada";
    }

    await reserva.update(atualizacao, { transaction });

    if (atualizacao.status === "cancelada" || atualizacao.status === "expirada") {
      await Horario.update(
        { status: "disponivel" },
        { where: { id: reserva.horarioId }, transaction },
      );
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
