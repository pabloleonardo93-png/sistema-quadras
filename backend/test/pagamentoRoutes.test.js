import assert from "node:assert/strict";
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
  const baseUrl = await iniciarServidor(t);
  const ignorado = await fetch(`${baseUrl}/api/webhooks/mercadopago`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ type: "merchant_order" }),
  });
  assert.equal(ignorado.status, 200);
  assert.deepEqual(await ignorado.json(), { recebido: true, ignorado: true });

  const checkout = await fetch(`${baseUrl}/api/reservas/invalida/pagamento`, { method: "POST" });
  assert.equal(checkout.status, 400);
  assert.deepEqual(await checkout.json(), { erro: "Reserva inv\u00e1lido." });
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
