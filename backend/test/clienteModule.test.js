import assert from "node:assert/strict";
import test from "node:test";
import jwt from "jsonwebtoken";
import Admin from "../src/models/Admin.js";
import Cliente from "../src/models/Cliente.js";
import LogSistema from "../src/models/LogSistema.js";
import { autenticarAdministrador } from "../src/middlewares/authMiddleware.js";
import { validarEmailVerificado } from "../src/middlewares/validarEmailVerificado.js";
import {
  alterarStatus,
  atualizar,
  buscarPorId,
  criar,
  perfilVerificado,
} from "../src/modules/clientes/cliente.controller.js";
import {
  validarAlteracaoStatus,
  validarAtualizacao,
  validarCriacaoPublica,
  validarIdCliente,
  validarPerfilVerificado,
} from "../src/modules/clientes/cliente.validation.js";
import { ADMIN_STATUS, CLIENTE_STATUS } from "../src/shared/constants/statusAdministrativos.js";
import ErroDaAplicacao from "../src/utils/ErroDaAplicacao.js";

function respostaFake() {
  return {
    statusCode: 200,
    payload: null,
    status(codigo) {
      this.statusCode = codigo;
      return this;
    },
    json(payload) {
      this.payload = payload;
      return this;
    },
  };
}

async function executarController(handler, req, validations = []) {
  const resposta = respostaFake();
  let erroCapturado = null;

  for (const validation of validations) {
    try {
      validation(req, resposta, (erro) => {
        if (erro) erroCapturado = erro;
      });
    } catch (erro) {
      erroCapturado = erro;
    }
    if (erroCapturado) return { resposta, erroCapturado };
  }

  await handler(req, resposta, (erro) => {
    erroCapturado = erro;
  });
  return { resposta, erroCapturado };
}

async function executarMiddleware(middleware, req) {
  let erroCapturado = null;
  let chamadasNext = 0;
  await middleware(req, respostaFake(), (erro) => {
    if (erro) erroCapturado = erro;
    else chamadasNext += 1;
  });
  return { erroCapturado, chamadasNext };
}

function reqCliente(overrides = {}) {
  return {
    headers: {},
    body: {
      nome: "Cliente Teste",
      telefone: "11981234567",
    },
    emailVerificado: {
      email: "cliente.modulo@teste.com",
      validadoEm: new Date("2026-07-25T10:00:00.000Z"),
    },
    admin: { id: 1 },
    params: {},
    query: {},
    ip: "127.0.0.1",
    ...overrides,
  };
}

test("cria cliente publico valido com e-mail verificado", async (t) => {
  const clienteCriado = {
    id: 10,
    nome: "Cliente Teste",
    telefone: "(11) 98123-4567",
    email: "cliente.modulo@teste.com",
    emailVerificadoEm: new Date("2026-07-25T10:00:00.000Z"),
  };

  t.mock.method(Cliente, "findOne", async () => null);
  const createMock = t.mock.method(Cliente, "create", async () => clienteCriado);

  const { resposta, erroCapturado } = await executarController(criar, reqCliente(), [validarCriacaoPublica]);

  assert.equal(erroCapturado, null);
  assert.equal(resposta.statusCode, 200);
  assert.equal(resposta.payload.mensagem, "Dados do cliente salvos com sucesso.");
  assert.deepEqual(resposta.payload.cliente, clienteCriado);
  assert.deepEqual(createMock.mock.calls[0].arguments[0], {
    nome: "Cliente Teste",
    telefone: "(11) 98123-4567",
    email: "cliente.modulo@teste.com",
    emailVerificadoEm: new Date("2026-07-25T10:00:00.000Z"),
  });
});

test("bloqueia criacao publica quando e-mail pertence a cliente inativo", async (t) => {
  t.mock.method(Cliente, "findOne", async () => ({ id: 20, status: CLIENTE_STATUS.INATIVO }));
  const createMock = t.mock.method(Cliente, "create", async () => ({}));

  const { erroCapturado } = await executarController(
    criar,
    reqCliente({ emailVerificado: { email: "cliente.inativo@teste.com", validadoEm: new Date() } }),
    [validarCriacaoPublica],
  );

  assert.ok(erroCapturado instanceof ErroDaAplicacao);
  assert.equal(erroCapturado.status, 409);
  assert.equal(createMock.mock.calls.length, 0);
});

test("exige validacao de e-mail antes da criacao publica", async () => {
  const { erroCapturado, chamadasNext } = await executarMiddleware(validarEmailVerificado, {
    headers: {},
    body: {},
  });

  assert.ok(erroCapturado instanceof ErroDaAplicacao);
  assert.equal(erroCapturado.status, 401);
  assert.equal(chamadasNext, 0);
});

test("consulta perfil autorizado por e-mail validado", async (t) => {
  const cliente = {
    id: 30,
    nome: "Cliente Perfil",
    telefone: "(11) 98888-7777",
    email: "perfil@teste.com",
    emailVerificadoEm: new Date("2026-07-25T11:00:00.000Z"),
  };
  t.mock.method(Cliente, "findOne", async () => cliente);

  const { resposta, erroCapturado } = await executarController(
    perfilVerificado,
    reqCliente({ emailVerificado: { email: "Perfil@Teste.com", validadoEm: new Date() } }),
    [validarPerfilVerificado],
  );

  assert.equal(erroCapturado, null);
  assert.equal(resposta.payload.email, "perfil@teste.com");
  assert.deepEqual(resposta.payload.cliente, cliente);
});

test("permite acesso administrativo com token valido", async (t) => {
  const admin = { id: 1, status: ADMIN_STATUS.ATIVO };
  t.mock.method(jwt, "verify", () => ({ sub: admin.id }));
  t.mock.method(Admin, "findByPk", async () => admin);

  const req = { headers: { authorization: "Bearer token-valido" } };
  const { erroCapturado, chamadasNext } = await executarMiddleware(autenticarAdministrador, req);

  assert.equal(erroCapturado, null);
  assert.equal(chamadasNext, 1);
  assert.equal(req.admin, admin);
});

test("nega acesso administrativo sem token", async () => {
  const { erroCapturado, chamadasNext } = await executarMiddleware(autenticarAdministrador, { headers: {} });

  assert.ok(erroCapturado instanceof ErroDaAplicacao);
  assert.equal(erroCapturado.status, 401);
  assert.equal(chamadasNext, 0);
});

test("atualiza cliente administrativo", async (t) => {
  const cliente = {
    id: 40,
    nome: "Antigo",
    email: "antigo@teste.com",
    update: t.mock.fn(async (dados) => Object.assign(cliente, dados)),
  };
  t.mock.method(Cliente, "findByPk", async () => cliente);
  t.mock.method(Cliente, "findOne", async () => null);
  const logMock = t.mock.method(LogSistema, "create", async () => ({}));

  const { resposta, erroCapturado } = await executarController(
    atualizar,
    reqCliente({
      params: { id: "40" },
      body: {
        nome: "Cliente Atualizado",
        telefone: "11977776666",
        email: "Atualizado@Teste.com",
      },
    }),
    [validarIdCliente, validarAtualizacao],
  );

  assert.equal(erroCapturado, null);
  assert.equal(resposta.payload.mensagem, "Cliente atualizado com sucesso.");
  assert.deepEqual(cliente.update.mock.calls[0].arguments[0], {
    nome: "Cliente Atualizado",
    telefone: "(11) 97777-6666",
    email: "atualizado@teste.com",
  });
  assert.equal(logMock.mock.calls[0].arguments[0].acao, "cliente_atualizado");
});

test("altera status do cliente", async (t) => {
  const cliente = {
    id: 50,
    status: CLIENTE_STATUS.ATIVO,
    update: t.mock.fn(async (dados) => Object.assign(cliente, dados)),
  };
  t.mock.method(Cliente, "findByPk", async () => cliente);
  const logMock = t.mock.method(LogSistema, "create", async () => ({}));

  const { resposta, erroCapturado } = await executarController(
    alterarStatus,
    reqCliente({
      params: { id: "50" },
      body: { status: CLIENTE_STATUS.INATIVO },
    }),
    [validarIdCliente, validarAlteracaoStatus],
  );

  assert.equal(erroCapturado, null);
  assert.equal(resposta.payload.mensagem, "Status do cliente atualizado.");
  assert.deepEqual(cliente.update.mock.calls[0].arguments[0], { status: CLIENTE_STATUS.INATIVO });
  assert.equal(logMock.mock.calls[0].arguments[0].detalhes.status, CLIENTE_STATUS.INATIVO);
});

test("rejeita id invalido de cliente antes da consulta", async (t) => {
  const findMock = t.mock.method(Cliente, "findByPk", async () => ({}));

  const { erroCapturado } = await executarController(
    buscarPorId,
    reqCliente({ params: { id: "abc" } }),
    [validarIdCliente],
  );

  assert.ok(erroCapturado instanceof ErroDaAplicacao);
  assert.equal(erroCapturado.status, 400);
  assert.equal(findMock.mock.calls.length, 0);
});

test("retorna erro quando cliente nao existe", async (t) => {
  t.mock.method(Cliente, "findByPk", async () => null);

  const { erroCapturado } = await executarController(
    buscarPorId,
    reqCliente({ params: { id: "99" } }),
    [validarIdCliente],
  );

  assert.ok(erroCapturado instanceof ErroDaAplicacao);
  assert.equal(erroCapturado.status, 404);
});
