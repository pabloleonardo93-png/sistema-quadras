import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import { once } from "node:events";
import http from "node:http";
import test from "node:test";
import app from "../src/app.js";

async function iniciarServidor(t) {
  const servidor = http.createServer(app);
  servidor.listen(0, "127.0.0.1");
  await once(servidor, "listening");
  t.after(() => servidor.close());
  return `http://127.0.0.1:${servidor.address().port}`;
}

function requisitar(baseUrl, path, { headers = {}, body } = {}) {
  const url = new URL(path, baseUrl);
  return new Promise((resolve, reject) => {
    const requisicao = http.request({
      hostname: url.hostname,
      port: url.port,
      path: `${url.pathname}${url.search}`,
      method: "POST",
      headers,
    }, (resposta) => {
      let conteudo = "";
      resposta.on("data", (parte) => { conteudo += parte; });
      resposta.on("end", () => resolve({ status: resposta.statusCode, conteudo }));
    });
    requisicao.on("error", reject);
    if (body !== undefined) requisicao.write(body);
    requisicao.end();
  });
}

test("protege criacao de checkout e Pix com verificacao de e-mail", async (t) => {
  const baseUrl = await iniciarServidor(t);
  for (const endpoint of ["mercadopago/criar", "mercadopago/pix/criar"]) {
    const resposta = await fetch(`${baseUrl}/api/pagamentos/${endpoint}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "{}",
    });
    assert.equal(resposta.status, 401);
    assert.deepEqual(await resposta.json(), { erro: "Valide o e-mail antes de continuar." });
  }
});

test("preserva retorno de webhook ignorado e valida id da reserva no checkout", async (t) => {
  const segredoAnterior = process.env.MERCADO_PAGO_WEBHOOK_SECRET;
  process.env.MERCADO_PAGO_WEBHOOK_SECRET = "segredo-webhook-teste";
  t.after(() => {
    if (segredoAnterior === undefined) delete process.env.MERCADO_PAGO_WEBHOOK_SECRET;
    else process.env.MERCADO_PAGO_WEBHOOK_SECRET = segredoAnterior;
  });
  const paymentId = "order-1";
  const requestId = "request-order-1";
  const ts = "1";
  const assinatura = createHmac("sha256", process.env.MERCADO_PAGO_WEBHOOK_SECRET)
    .update(`id:${paymentId};request-id:${requestId};ts:${ts};`)
    .digest("hex");
  const baseUrl = await iniciarServidor(t);
  const ignorado = await fetch(`${baseUrl}/api/webhooks/mercadopago`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Request-Id": requestId,
      "X-Signature": `ts=${ts},v1=${assinatura}`,
    },
    body: JSON.stringify({ type: "merchant_order", data: { id: paymentId } }),
  });
  assert.equal(ignorado.status, 200);
  assert.deepEqual(await ignorado.json(), { recebido: true, ignorado: true });

  const checkout = await fetch(`${baseUrl}/api/reservas/invalida/pagamento`, { method: "POST" });
  assert.equal(checkout.status, 401);
  assert.deepEqual(await checkout.json(), { erro: "Valide o e-mail antes de continuar." });
});

test("rejeita assinatura invalida antes de consultar o provider", async (t) => {
  const segredoAnterior = process.env.MERCADO_PAGO_WEBHOOK_SECRET;
  process.env.MERCADO_PAGO_WEBHOOK_SECRET = "segredo-webhook-teste";
  t.after(() => {
    if (segredoAnterior === undefined) delete process.env.MERCADO_PAGO_WEBHOOK_SECRET;
    else process.env.MERCADO_PAGO_WEBHOOK_SECRET = segredoAnterior;
  });
  const baseUrl = await iniciarServidor(t);
  const resposta = await fetch(`${baseUrl}/api/pagamentos/mercadopago/webhook`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ type: "payment", data: { id: "1005" } }),
  });

  assert.equal(resposta.status, 401);
  assert.deepEqual(await resposta.json(), { erro: "Webhook do Mercado Pago sem assinatura valida." });
});

test("rejeita webhook sem assinatura antes de acessar payload ou provider", async (t) => {
  const segredoAnterior = process.env.MERCADO_PAGO_WEBHOOK_SECRET;
  process.env.MERCADO_PAGO_WEBHOOK_SECRET = "segredo-webhook-teste";
  t.after(() => {
    if (segredoAnterior === undefined) delete process.env.MERCADO_PAGO_WEBHOOK_SECRET;
    else process.env.MERCADO_PAGO_WEBHOOK_SECRET = segredoAnterior;
  });
  const fetchOriginal = globalThis.fetch;
  let chamadasAoProvider = 0;
  globalThis.fetch = async () => {
    chamadasAoProvider += 1;
    throw new Error("O provider nao deve ser chamado.");
  };
  t.after(() => { globalThis.fetch = fetchOriginal; });

  const baseUrl = await iniciarServidor(t);
  for (const path of [
    "/api/webhooks/mercadopago",
    "/api/pagamentos/mercadopago/webhook",
    "/api/pagamentos/mercado-pago/webhook",
  ]) {
    const semBody = await requisitar(baseUrl, path);
    assert.equal(semBody.status, 401);
    assert.deepEqual(JSON.parse(semBody.conteudo), { erro: "Webhook do Mercado Pago sem assinatura valida." });

    const bodyVazio = await requisitar(baseUrl, path, {
      headers: { "Content-Type": "application/json" },
      body: "{}",
    });
    assert.equal(bodyVazio.status, 401);
    assert.deepEqual(JSON.parse(bodyVazio.conteudo), { erro: "Webhook do Mercado Pago sem assinatura valida." });
  }
  const assinaturaInvalida = await requisitar(baseUrl, "/api/webhooks/mercadopago", {
    headers: {
      "Content-Type": "application/json",
      "X-Request-Id": "request-invalido",
      "X-Signature": "ts=1,v1=invalida",
    },
    body: JSON.stringify({ type: "payment", data: { id: "1005" } }),
  });
  assert.equal(assinaturaInvalida.status, 401);
  assert.equal(chamadasAoProvider, 0);
});
