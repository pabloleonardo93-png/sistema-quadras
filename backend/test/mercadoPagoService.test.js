import assert from "node:assert/strict";
import test from "node:test";
import sequelize from "../src/config/database.js";
import Horario from "../src/models/Horario.js";
import LogSistema from "../src/models/LogSistema.js";
import Reserva from "../src/models/Reserva.js";
import { PAGAMENTO_STATUS } from "../src/shared/constants/pagamentoStatus.js";
import { RESERVA_STATUS } from "../src/shared/constants/reservaStatus.js";
import { HORARIO_STATUS } from "../src/shared/constants/statusAdministrativos.js";
import {
  criarCheckoutDaReserva,
  processarWebhookMercadoPago,
} from "../src/services/mercadoPagoService.js";
import ErroDaAplicacao from "../src/utils/ErroDaAplicacao.js";

const transaction = { LOCK: { UPDATE: "UPDATE" } };

function reservaPagamento(t, overrides = {}) {
  return {
    id: 50,
    status: RESERVA_STATUS.AGUARDANDO_PAGAMENTO,
    pagamentoStatus: PAGAMENTO_STATUS.PENDENTE,
    valorTotal: 120,
    data: "2099-01-06",
    horaInicio: "18:00",
    horarioId: 40,
    cliente: {
      nome: "Cliente Teste",
      email: "cliente@teste.com",
      telefone: "(11) 99999-1111",
    },
    quadra: { nome: "Areia 1", valorHora: 120 },
    modalidade: { nome: "Beach Tennis" },
    update: t.mock.fn(async () => {}),
    ...overrides,
  };
}

function mockMercadoPagoEnv(t) {
  const accessTokenOriginal = process.env.MERCADO_PAGO_ACCESS_TOKEN;
  const appUrlOriginal = process.env.APP_PUBLIC_URL;
  const apiUrlOriginal = process.env.API_PUBLIC_URL;
  process.env.MERCADO_PAGO_ACCESS_TOKEN = "mp-token-teste";
  process.env.APP_PUBLIC_URL = "https://reservas.example.com";
  process.env.API_PUBLIC_URL = "https://api.example.com";
  t.after(() => {
    if (accessTokenOriginal === undefined) delete process.env.MERCADO_PAGO_ACCESS_TOKEN;
    else process.env.MERCADO_PAGO_ACCESS_TOKEN = accessTokenOriginal;
    if (appUrlOriginal === undefined) delete process.env.APP_PUBLIC_URL;
    else process.env.APP_PUBLIC_URL = appUrlOriginal;
    if (apiUrlOriginal === undefined) delete process.env.API_PUBLIC_URL;
    else process.env.API_PUBLIC_URL = apiUrlOriginal;
  });
}

function fetchResponse({ ok = true, status = 200, body = null } = {}) {
  return {
    ok,
    status,
    text: async () => (body ? JSON.stringify(body) : ""),
  };
}

test("cria pagamento sem chamada real ao Mercado Pago", async (t) => {
  mockMercadoPagoEnv(t);

  const reserva = reservaPagamento(t);
  const reservaAtualizada = { ...reserva, mercadoPagoPreferenceId: "pref-123" };
  const findByPkMock = t.mock.method(Reserva, "findByPk", async () => reserva);
  const logMock = t.mock.method(LogSistema, "create", async () => ({}));
  const fetchMock = t.mock.method(globalThis, "fetch", async () =>
    fetchResponse({
      status: 201,
      body: {
        id: "pref-123",
        init_point: "https://mercadopago.example/checkout",
      },
    }));

  let chamadasFind = 0;
  findByPkMock.mock.mockImplementation(async () => {
    chamadasFind += 1;
    return chamadasFind === 1 ? reserva : reservaAtualizada;
  });

  const resultado = await criarCheckoutDaReserva({ reservaId: reserva.id });

  assert.equal(resultado.checkoutUrl, "https://mercadopago.example/checkout");
  assert.equal(resultado.preferenceId, "pref-123");
  assert.equal(resultado.reserva, reservaAtualizada);
  assert.equal(fetchMock.mock.calls.length, 1);
  assert.match(fetchMock.mock.calls[0].arguments[0], /\/checkout\/preferences$/);
  const atualizacaoPagamento = reserva.update.mock.calls[0].arguments[0];
  assert.equal(atualizacaoPagamento.pagamentoStatus, PAGAMENTO_STATUS.PENDENTE);
  assert.equal(atualizacaoPagamento.mercadoPagoPreferenceId, "pref-123");
  assert.equal(atualizacaoPagamento.pagamentoUrl, "https://mercadopago.example/checkout");
  assert.ok(atualizacaoPagamento.pagamentoCriadoEm instanceof Date);
  assert.equal(logMock.mock.calls[0].arguments[0].acao, "pagamento_criado");
});

test("propaga falha amigavel quando Mercado Pago recusa a credencial", async (t) => {
  mockMercadoPagoEnv(t);

  const reserva = reservaPagamento(t);
  t.mock.method(Reserva, "findByPk", async () => reserva);
  t.mock.method(globalThis, "fetch", async () =>
    fetchResponse({
      ok: false,
      status: 401,
      body: { message: "Unauthorized use of live credentials" },
    }));

  await assert.rejects(
    () => criarCheckoutDaReserva({ reservaId: reserva.id }),
    (erro) =>
      erro instanceof ErroDaAplicacao &&
      erro.status === 401 &&
      /Mercado Pago recusou a credencial atual/.test(erro.message),
  );
  assert.equal(reserva.update.mock.calls.length, 0);
});

test("atualiza pagamento aprovado pelo webhook e confirma a reserva", async (t) => {
  mockMercadoPagoEnv(t);
  t.mock.method(sequelize, "transaction", async (callback) => callback(transaction));

  const reserva = reservaPagamento(t);
  t.mock.method(Reserva, "findOne", async () => reserva);
  const horarioUpdateMock = t.mock.method(Horario, "update", async () => [1]);
  const logMock = t.mock.method(LogSistema, "create", async () => ({}));
  t.mock.method(globalThis, "fetch", async () =>
    fetchResponse({
      body: {
        id: 999,
        status: "approved",
        status_detail: "accredited",
        external_reference: String(reserva.id),
        date_approved: "2026-07-11T10:02:00.000Z",
      },
    }));

  const resultado = await processarWebhookMercadoPago({ paymentId: "999" });

  assert.deepEqual(resultado, {
    processado: true,
    reservaId: reserva.id,
    pagamentoStatus: PAGAMENTO_STATUS.APROVADO,
  });
  assert.deepEqual(reserva.update.mock.calls[0].arguments[0], {
    pagamentoStatus: PAGAMENTO_STATUS.APROVADO,
    mercadoPagoPaymentId: "999",
    mercadoPagoStatus: "approved",
    mercadoPagoStatusDetail: "accredited",
    pagoEm: new Date("2026-07-11T10:02:00.000Z"),
    status: RESERVA_STATUS.CONFIRMADA,
  });
  assert.equal(horarioUpdateMock.mock.calls.length, 0);
  assert.equal(logMock.mock.calls[0].arguments[0].acao, "pagamento_atualizado");
});

test("webhook de pagamento expirado libera o horario", async (t) => {
  mockMercadoPagoEnv(t);
  t.mock.method(sequelize, "transaction", async (callback) => callback(transaction));

  const reserva = reservaPagamento(t);
  t.mock.method(Reserva, "findOne", async () => reserva);
  const horarioUpdateMock = t.mock.method(Horario, "update", async () => [1]);
  t.mock.method(LogSistema, "create", async () => ({}));
  t.mock.method(globalThis, "fetch", async () =>
    fetchResponse({
      body: {
        id: 1000,
        status: "expired",
        status_detail: "expired",
        external_reference: String(reserva.id),
      },
    }));

  const resultado = await processarWebhookMercadoPago({ paymentId: "1000" });

  assert.equal(resultado.pagamentoStatus, PAGAMENTO_STATUS.CANCELADO);
  assert.equal(reserva.update.mock.calls[0].arguments[0].status, RESERVA_STATUS.EXPIRADA);
  assert.deepEqual(horarioUpdateMock.mock.calls[0].arguments, [
    { status: HORARIO_STATUS.DISPONIVEL },
    { where: { id: reserva.horarioId }, transaction },
  ]);
});
