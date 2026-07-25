import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import { once } from "node:events";
import http from "node:http";
import { spawn } from "node:child_process";
import test from "node:test";
import jwt from "jsonwebtoken";
import app from "../src/app.js";
import Reserva from "../src/models/Reserva.js";
import VerificacaoEmail from "../src/models/VerificacaoEmail.js";
import { PAGAMENTO_STATUS } from "../src/shared/constants/pagamentoStatus.js";
import { RESERVA_STATUS } from "../src/shared/constants/reservaStatus.js";
import {
  validarAssinaturaWebhookMercadoPago,
  validarConfiguracaoWebhookMercadoPago,
} from "../src/modules/pagamentos/providers/mercadoPagoClient.js";
import ErroDaAplicacao from "../src/utils/ErroDaAplicacao.js";

function reservaPaga() {
  return {
    id: 70,
    status: RESERVA_STATUS.CONFIRMADA,
    pagamentoStatus: PAGAMENTO_STATUS.APROVADO,
    valorTotal: 120,
    data: "2099-01-06",
    horaInicio: "18:00",
    horaFim: "19:00",
    pagamentoUrl: "https://mercadopago.example/checkout",
    mercadoPagoPreferenceId: "pref-70",
    cliente: {
      nome: "Cliente Privado",
      email: "cliente@teste.com",
      telefone: "11999991111",
    },
    quadra: { id: 20, nome: "Areia 1" },
    modalidade: { id: 30, nome: "Beach Tennis" },
  };
}

async function iniciarServidor(t) {
  const servidor = http.createServer(app);
  servidor.listen(0, "127.0.0.1");
  await once(servidor, "listening");
  t.after(() => servidor.close());
  return `http://127.0.0.1:${servidor.address().port}`;
}

function tokenEmail(email) {
  return jwt.sign(
    { tipo: "email_verificado", verificacaoId: 33, email },
    process.env.JWT_SECRET,
    { expiresIn: "1h" },
  );
}

function prepararSessaoEmail(t) {
  t.mock.method(VerificacaoEmail, "findOne", async () => ({
    id: 33,
    email: "cliente@teste.com",
    validadoEm: new Date("2026-07-11T10:00:00.000Z"),
    tokenExpiraEm: new Date("2099-01-01T00:00:00.000Z"),
  }));
}

function iniciarBackendComEnv(env) {
  return new Promise((resolve, reject) => {
    const processo = spawn(process.execPath, ["src/server.js"], {
      cwd: process.cwd(),
      env: { ...process.env, ...env },
      stdio: ["ignore", "pipe", "pipe"],
    });
    let saida = "";
    processo.stderr.on("data", (dados) => { saida += dados; });
    processo.on("error", reject);
    processo.on("close", (codigo) => resolve({ codigo, saida }));
  });
}

test("falha na inicializacao em producao sem segredo do webhook", async () => {
  const resultado = await iniciarBackendComEnv({
    NODE_ENV: "production",
    JWT_SECRET: "segredo-de-teste",
    MERCADO_PAGO_WEBHOOK_SECRET: "",
  });

  assert.equal(resultado.codigo, 1);
  assert.match(resultado.saida, /MERCADO_PAGO_WEBHOOK_SECRET/);
});

test("preserva configuracao de desenvolvimento sem segredo do webhook", () => {
  assert.throws(
    () => validarConfiguracaoWebhookMercadoPago({ ambiente: "production", segredo: "" }),
    /MERCADO_PAGO_WEBHOOK_SECRET/,
  );
  assert.doesNotThrow(() => validarConfiguracaoWebhookMercadoPago({ ambiente: "development", segredo: "" }));
});

test("rejeita assinatura ausente ou invalida quando o segredo esta configurado", (t) => {
  const segredoAnterior = process.env.MERCADO_PAGO_WEBHOOK_SECRET;
  const ambienteAnterior = process.env.NODE_ENV;
  process.env.MERCADO_PAGO_WEBHOOK_SECRET = "segredo-webhook-teste";
  process.env.NODE_ENV = "production";
  t.after(() => {
    if (segredoAnterior === undefined) delete process.env.MERCADO_PAGO_WEBHOOK_SECRET;
    else process.env.MERCADO_PAGO_WEBHOOK_SECRET = segredoAnterior;
    if (ambienteAnterior === undefined) delete process.env.NODE_ENV;
    else process.env.NODE_ENV = ambienteAnterior;
  });

  assert.throws(
    () => validarAssinaturaWebhookMercadoPago({ paymentId: "70" }),
    (erro) => erro instanceof ErroDaAplicacao && erro.status === 401,
  );
  const signature = createHmac("sha256", process.env.MERCADO_PAGO_WEBHOOK_SECRET)
    .update("id:70;request-id:request-70;ts:1;")
    .digest("hex");
  assert.doesNotThrow(() => validarAssinaturaWebhookMercadoPago({
    paymentId: "70",
    requestId: "request-70",
    signature: `ts=1,v1=${signature}`,
  }));
  assert.throws(
    () => validarAssinaturaWebhookMercadoPago({
      paymentId: "70",
      requestId: "request-70",
      signature: "ts=1,v1=invalida",
    }),
    (erro) => erro instanceof ErroDaAplicacao && erro.status === 401,
  );
});

test("checkout legado exige comprovacao de posse e remove dados pessoais da resposta", async (t) => {
  const segredoAnterior = process.env.JWT_SECRET;
  process.env.JWT_SECRET = "segredo-de-teste";
  t.after(() => {
    if (segredoAnterior === undefined) delete process.env.JWT_SECRET;
    else process.env.JWT_SECRET = segredoAnterior;
  });
  prepararSessaoEmail(t);
  const reserva = reservaPaga();
  t.mock.method(Reserva, "findByPk", async (id) => (id === 70 ? reserva : null));
  const baseUrl = await iniciarServidor(t);

  const semToken = await fetch(`${baseUrl}/api/reservas/70/pagamento`, { method: "POST" });
  assert.equal(semToken.status, 401);

  const tokenInvalido = await fetch(`${baseUrl}/api/reservas/70/pagamento`, {
    method: "POST",
    headers: { "X-Email-Verification-Token": "x".repeat(40) },
  });
  assert.equal(tokenInvalido.status, 401);

  const tokenOutroCliente = await fetch(`${baseUrl}/api/reservas/70/pagamento`, {
    method: "POST",
    headers: { "X-Email-Verification-Token": tokenEmail("outro@teste.com") },
  });
  assert.equal(tokenOutroCliente.status, 403);

  const inexistente = await fetch(`${baseUrl}/api/reservas/999/pagamento`, {
    method: "POST",
    headers: { "X-Email-Verification-Token": tokenEmail("cliente@teste.com") },
  });
  assert.equal(inexistente.status, 404);

  const autorizado = await fetch(`${baseUrl}/api/reservas/70/pagamento`, {
    method: "POST",
    headers: { "X-Email-Verification-Token": tokenEmail("cliente@teste.com") },
  });
  assert.equal(autorizado.status, 201);
  const dados = await autorizado.json();
  assert.equal(dados.reserva.id, 70);
  assert.equal(Object.hasOwn(dados.reserva, "cliente"), false);
  assert.equal(JSON.stringify(dados).includes("Cliente Privado"), false);
  assert.equal(JSON.stringify(dados).includes("cliente@teste.com"), false);
  assert.equal(JSON.stringify(dados).includes("11999991111"), false);
});
