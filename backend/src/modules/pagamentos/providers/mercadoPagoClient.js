import { createHmac, timingSafeEqual } from "node:crypto";
import ErroDaAplicacao from "../../../utils/ErroDaAplicacao.js";

const MERCADO_PAGO_API = "https://api.mercadopago.com";

function accessToken() {
  return process.env.MERCADO_PAGO_ACCESS_TOKEN;
}

export function garantirMercadoPagoConfigurado() {
  if (!accessToken()) {
    throw new ErroDaAplicacao("Mercado Pago nao configurado. Defina MERCADO_PAGO_ACCESS_TOKEN no backend.", 503);
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
  garantirMercadoPagoConfigurado();

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

export function criarCheckout(dados) {
  return chamarMercadoPago("/checkout/preferences", dados);
}

export function criarPix(dados) {
  return chamarMercadoPago("/v1/payments", dados);
}

export function buscarPagamento(paymentId) {
  return chamarMercadoPago(`/v1/payments/${encodeURIComponent(paymentId)}`);
}
