import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import sequelize from "../src/config/database.js";
import Cliente from "../src/models/Cliente.js";
import Horario from "../src/models/Horario.js";
import LogSistema from "../src/models/LogSistema.js";
import Reserva from "../src/models/Reserva.js";
import {
  atualizarDadosDaMinhaReserva,
  buscarMinhaReserva,
  cancelarMinhaReserva,
  dadosMinhaReserva,
  listarMinhasReservas,
} from "../src/services/reservaService.js";

const raiz = new URL("../", import.meta.url);

function transactionFake() {
  return { LOCK: { UPDATE: "UPDATE" } };
}

function mockRateLimitAndTransactions(t) {
  const transaction = transactionFake();
  t.mock.method(sequelize, "query", async () => [{ quantidade: 1 }]);
  t.mock.method(sequelize, "transaction", async (callback) => callback(transaction));
  return transaction;
}

function reservaFake(overrides = {}) {
  const cliente = {
    id: 8,
    nome: "Cliente Teste",
    telefone: "(51) 99999-1234",
    email: "cliente@teste.com",
    status: "ativo",
    async update(values) { Object.assign(this, values); },
  };
  return {
    id: 42,
    clienteId: cliente.id,
    cliente,
    quadra: { id: 2, nome: "Areia 02" },
    modalidade: { id: 3, nome: "Beach Tennis" },
    horarioId: 11,
    data: "2026-08-10",
    horaInicio: "10:00:00",
    horaFim: "11:00:00",
    valorTotal: "85.00",
    status: "aguardando_pagamento",
    pagamentoStatus: "pendente",
    pagamentoTipo: "pix",
    pagamentoCriadoEm: new Date("2026-08-07T12:00:00.000Z"),
    pagamentoExpiraEm: new Date("2026-08-07T12:10:00.000Z"),
    pagamentoUrl: "https://www.mercadopago.com/pix/continuar",
    pixCopiaECola: "codigo-pix-publico",
    pixQrCodeBase64: "base64-publico",
    mercadoPagoPaymentId: "nao-deve-vazar",
    mercadoPagoPreferenceId: "nao-deve-vazar",
    mercadoPagoStatus: "pending",
    async update(values) { Object.assign(this, values); },
    ...overrides,
  };
}

test("lista reservas filtrando pelo e-mail normalizado da sessao", async (t) => {
  let query;
  t.mock.method(Reserva, "findAll", async (options) => {
    query = options;
    return [];
  });

  const reservas = await listarMinhasReservas({ email: " CLIENTE@TESTE.COM " });

  assert.deepEqual(reservas, []);
  assert.equal(query.include[0].as, "cliente");
  assert.equal(query.include[0].required, true);
  assert.equal(query.include[0].where.email, "cliente@teste.com");
});

test("reserva inexistente e reserva de outro cliente retornam o mesmo 404", async (t) => {
  let emailConsultado;
  t.mock.method(Reserva, "findOne", async (options) => {
    emailConsultado = options.include[0].where.email;
    return null;
  });

  await assert.rejects(
    buscarMinhaReserva({ id: 42, email: "cliente-a@teste.com" }),
    (erro) => erro.status === 404 && erro.message === "Reserva nao encontrada.",
  );
  assert.equal(emailConsultado, "cliente-a@teste.com");
});

test("resposta publica nao expoe identificadores internos do Mercado Pago", () => {
  const reserva = reservaFake();
  const resposta = dadosMinhaReserva(reserva, {
    detalhes: true,
    agora: new Date("2026-08-07T12:05:00.000Z"),
  });
  const json = JSON.stringify(resposta);

  assert.equal(resposta.pagamento.forma, "pix");
  assert.equal(resposta.pagamento.podeContinuar, true);
  assert.equal(resposta.pagamento.pix.qrCode, "codigo-pix-publico");
  assert.doesNotMatch(json, /nao-deve-vazar|mercadoPagoPaymentId|mercadoPagoPreferenceId|mercadoPagoStatus/);
});

test("pagamento expirado nao devolve QR Code nem URL para continuar", () => {
  const resposta = dadosMinhaReserva(reservaFake(), {
    detalhes: true,
    agora: new Date("2026-08-07T12:11:00.000Z"),
  });

  assert.equal(resposta.pagamento.podeContinuar, false);
  assert.equal("pix" in resposta.pagamento, false);
  assert.equal("checkoutUrl" in resposta.pagamento, false);
});

test("cliente nao consegue cancelar reserva pertencente a outro e-mail", async (t) => {
  mockRateLimitAndTransactions(t);
  const reserva = reservaFake({ clienteId: 99 });
  let horarioLiberado = false;
  t.mock.method(Reserva, "findByPk", async () => reserva);
  t.mock.method(Cliente, "findOne", async () => null);
  t.mock.method(Horario, "update", async () => { horarioLiberado = true; });

  await assert.rejects(
    cancelarMinhaReserva({ id: reserva.id, emailVerificado: "cliente-a@teste.com" }),
    (erro) => erro.status === 404 && erro.message === "Reserva nao encontrada.",
  );
  assert.equal(horarioLiberado, false);
  assert.equal(reserva.status, "aguardando_pagamento");
});

test("cancelamento de reserva nao paga libera o horario e registra auditoria", async (t) => {
  mockRateLimitAndTransactions(t);
  const reserva = reservaFake();
  let consultasReserva = 0;
  let horarioUpdate;
  let logCriado;
  t.mock.method(Reserva, "findByPk", async () => {
    consultasReserva += 1;
    return reserva;
  });
  t.mock.method(Cliente, "findOne", async () => reserva.cliente);
  t.mock.method(Horario, "update", async (...args) => { horarioUpdate = args; });
  t.mock.method(LogSistema, "create", async (values) => { logCriado = values; return values; });

  const resultado = await cancelarMinhaReserva({
    id: reserva.id,
    emailVerificado: reserva.cliente.email,
    enderecoIp: "127.0.0.1",
  });

  assert.equal(consultasReserva, 2);
  assert.equal(reserva.status, "cancelada");
  assert.equal(reserva.pagamentoStatus, "cancelado");
  assert.deepEqual(horarioUpdate[0], { status: "disponivel" });
  assert.deepEqual(horarioUpdate[1].where, { id: reserva.horarioId });
  assert.equal(logCriado.acao, "reserva_cancelada");
  assert.equal(resultado.status, "cancelada");
});

test("reserva paga nao pode ser cancelada pelo cliente", async (t) => {
  mockRateLimitAndTransactions(t);
  const reserva = reservaFake({ status: "confirmada", pagamentoStatus: "aprovado" });
  let horarioLiberado = false;
  t.mock.method(Reserva, "findByPk", async () => reserva);
  t.mock.method(Cliente, "findOne", async () => reserva.cliente);
  t.mock.method(Horario, "update", async () => { horarioLiberado = true; });

  await assert.rejects(
    cancelarMinhaReserva({ id: reserva.id, emailVerificado: reserva.cliente.email }),
    (erro) => erro.status === 409,
  );
  assert.equal(horarioLiberado, false);
  assert.equal(reserva.status, "confirmada");
});

test("cliente nao consegue alterar dados usando reserva de outro e-mail", async (t) => {
  mockRateLimitAndTransactions(t);
  const reserva = reservaFake({ clienteId: 99 });
  let clienteAtualizado = false;
  t.mock.method(Reserva, "findByPk", async () => reserva);
  t.mock.method(Cliente, "findOne", async () => null);
  t.mock.method(reserva.cliente, "update", async () => { clienteAtualizado = true; });

  await assert.rejects(
    atualizarDadosDaMinhaReserva({
      id: reserva.id,
      emailVerificado: "cliente-a@teste.com",
      nome: "Cliente A",
      telefone: "(51) 99999-1234",
    }),
    (erro) => erro.status === 404 && erro.message === "Reserva nao encontrada.",
  );
  assert.equal(clienteAtualizado, false);
});

test("cliente altera somente nome e telefone sem trocar o e-mail", async (t) => {
  mockRateLimitAndTransactions(t);
  const reserva = reservaFake();
  let logCriado;
  t.mock.method(Reserva, "findByPk", async () => reserva);
  t.mock.method(Cliente, "findOne", async () => reserva.cliente);
  t.mock.method(LogSistema, "create", async (values) => { logCriado = values; return values; });

  const cliente = await atualizarDadosDaMinhaReserva({
    id: reserva.id,
    emailVerificado: reserva.cliente.email,
    nome: "  Nome Atualizado  ",
    telefone: "+55 51 98888-1234",
    email: "outro@teste.com",
  });

  assert.equal(cliente.nome, "Nome Atualizado");
  assert.equal(cliente.telefone, "(51) 98888-1234");
  assert.equal(cliente.email, "cliente@teste.com");
  assert.equal(logCriado.acao, "cliente_atualizado_pelo_cliente");
});

test("continuacao de cartao usa somente a URL existente e nao cria nova forma", () => {
  const resposta = dadosMinhaReserva(reservaFake({
    pagamentoTipo: "checkout",
    pagamentoUrl: "https://www.mercadopago.com/checkout/existente",
    pixCopiaECola: null,
    pixQrCodeBase64: null,
  }), {
    detalhes: true,
    agora: new Date("2026-08-07T12:05:00.000Z"),
  });

  assert.equal(resposta.pagamento.forma, "cartao");
  assert.equal(resposta.pagamento.checkoutUrl, "https://www.mercadopago.com/checkout/existente");
  assert.equal("pix" in resposta.pagamento, false);
});

test("rotas de minhas reservas exigem sessao de e-mail verificada", async () => {
  const source = await readFile(new URL("src/routes/reservaRoutes.js", raiz), "utf8");
  assert.match(source, /router\.get\("\/minhas", validarEmailVerificado/);
  assert.match(source, /router\.get\("\/minhas\/:id", validarEmailVerificado/);
  assert.match(source, /router\.patch\("\/minhas\/:id\/dados", validarEmailVerificado/);
  assert.match(source, /router\.post\("\/minhas\/:id\/cancelar", validarEmailVerificado/);
});

test("pagina de minhas reservas nao cria nem troca pagamentos", async () => {
  const source = await readFile(new URL("../frontend/src/pages/MinhasReservas.jsx", raiz), "utf8");
  assert.doesNotMatch(source, /criarPix|criarPagamento|trocarPagamento|mercadopago\/criar/);
  assert.match(source, /pagamento\.pix\.qrCode/);
  assert.match(source, /pagamento\.checkoutUrl/);
});
