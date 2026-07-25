import assert from "node:assert/strict";
import test from "node:test";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import Admin from "../src/models/Admin.js";
import LogSistema from "../src/models/LogSistema.js";
import { autenticarAdministrador } from "../src/middlewares/authMiddleware.js";
import { login, me } from "../src/modules/auth/auth.controller.js";
import { validarLogin } from "../src/modules/auth/auth.validation.js";
import { ADMIN_STATUS } from "../src/shared/constants/statusAdministrativos.js";
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

async function executarHandler(handler, req, validations = []) {
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

function reqLogin(overrides = {}) {
  return {
    body: {
      email: "admin@teste.com",
      senha: "senha-segura",
    },
    ip: "127.0.0.1",
    ...overrides,
  };
}

test("realiza login administrativo valido sem retornar senha", async (t) => {
  const administradorComSenha = {
    id: 1,
    email: "admin@teste.com",
    senhaHash: "hash",
    permissao: "administrador",
    status: ADMIN_STATUS.ATIVO,
  };
  const administradorPublico = {
    id: 1,
    nome: "Administrador",
    email: "admin@teste.com",
    permissao: "administrador",
    status: ADMIN_STATUS.ATIVO,
  };
  const scopeMock = t.mock.method(Admin, "scope", () => ({
    findOne: async () => administradorComSenha,
  }));
  t.mock.method(Admin, "findByPk", async () => administradorPublico);
  t.mock.method(bcrypt, "compare", async () => true);
  const logMock = t.mock.method(LogSistema, "create", async () => ({}));
  t.mock.method(jwt, "sign", () => "token-admin");

  const { resposta, erroCapturado } = await executarHandler(login, reqLogin(), [validarLogin]);

  assert.equal(erroCapturado, null);
  assert.equal(resposta.statusCode, 200);
  assert.equal(resposta.payload.mensagem, "Login realizado com sucesso.");
  assert.equal(resposta.payload.token, "token-admin");
  assert.equal(resposta.payload.administrador, administradorPublico);
  assert.equal(Object.hasOwn(resposta.payload.administrador, "senhaHash"), false);
  assert.deepEqual(scopeMock.mock.calls[0].arguments, ["comSenha"]);
  assert.equal(logMock.mock.calls[0].arguments[0].acao, "login_realizado");
});

test("rejeita login com senha incorreta", async (t) => {
  const administrador = { id: 1, senhaHash: "hash", status: ADMIN_STATUS.ATIVO };
  t.mock.method(Admin, "scope", () => ({ findOne: async () => administrador }));
  const buscarPublico = t.mock.method(Admin, "findByPk", async () => ({}));
  t.mock.method(bcrypt, "compare", async () => false);

  const { erroCapturado } = await executarHandler(login, reqLogin(), [validarLogin]);

  assert.ok(erroCapturado instanceof ErroDaAplicacao);
  assert.equal(erroCapturado.status, 401);
  assert.equal(buscarPublico.mock.calls.length, 0);
});

test("rejeita login com e-mail inexistente", async (t) => {
  t.mock.method(Admin, "scope", () => ({ findOne: async () => null }));
  const compararSenha = t.mock.method(bcrypt, "compare", async () => true);

  const { erroCapturado } = await executarHandler(login, reqLogin(), [validarLogin]);

  assert.ok(erroCapturado instanceof ErroDaAplicacao);
  assert.equal(erroCapturado.status, 401);
  assert.equal(compararSenha.mock.calls.length, 0);
});

test("rejeita login de administrador inativo", async (t) => {
  t.mock.method(Admin, "scope", () => ({
    findOne: async () => ({ id: 1, senhaHash: "hash", status: ADMIN_STATUS.INATIVO }),
  }));
  const compararSenha = t.mock.method(bcrypt, "compare", async () => true);

  const { erroCapturado } = await executarHandler(login, reqLogin(), [validarLogin]);

  assert.ok(erroCapturado instanceof ErroDaAplicacao);
  assert.equal(erroCapturado.status, 401);
  assert.equal(compararSenha.mock.calls.length, 0);
});

test("valida os dados de login antes de consultar o administrador", async (t) => {
  const scopeMock = t.mock.method(Admin, "scope", () => ({ findOne: async () => ({}) }));

  const { erroCapturado } = await executarHandler(
    login,
    reqLogin({ body: { email: "invalido", senha: "" } }),
    [validarLogin],
  );

  assert.ok(erroCapturado instanceof ErroDaAplicacao);
  assert.equal(erroCapturado.status, 400);
  assert.equal(scopeMock.mock.calls.length, 0);
});

test("retorna o administrador autenticado no endpoint me sem senha", async () => {
  const administrador = {
    id: 1,
    nome: "Administrador",
    email: "admin@teste.com",
    status: ADMIN_STATUS.ATIVO,
  };

  const { resposta, erroCapturado } = await executarHandler(me, { admin: administrador });

  assert.equal(erroCapturado, null);
  assert.equal(resposta.statusCode, 200);
  assert.equal(resposta.payload.administrador, administrador);
  assert.equal(Object.hasOwn(resposta.payload.administrador, "senhaHash"), false);
});

test("autoriza middleware administrativo com token valido", async (t) => {
  const administrador = { id: 1, status: ADMIN_STATUS.ATIVO };
  t.mock.method(jwt, "verify", () => ({ sub: "1", permissao: "administrador" }));
  t.mock.method(Admin, "findByPk", async () => administrador);
  const req = { headers: { authorization: "Bearer token-valido" } };

  const { erroCapturado, chamadasNext } = await executarMiddleware(autenticarAdministrador, req);

  assert.equal(erroCapturado, null);
  assert.equal(chamadasNext, 1);
  assert.equal(req.admin, administrador);
});

test("nega middleware administrativo sem token", async () => {
  const { erroCapturado, chamadasNext } = await executarMiddleware(autenticarAdministrador, { headers: {} });

  assert.ok(erroCapturado instanceof ErroDaAplicacao);
  assert.equal(erroCapturado.status, 401);
  assert.equal(chamadasNext, 0);
});

test("repassa token invalido para o tratamento de erro", async (t) => {
  t.mock.method(jwt, "verify", () => {
    throw new jwt.JsonWebTokenError("token invalido");
  });
  const buscarAdministrador = t.mock.method(Admin, "findByPk", async () => ({}));

  const { erroCapturado, chamadasNext } = await executarMiddleware(
    autenticarAdministrador,
    { headers: { authorization: "Bearer token-invalido" } },
  );

  assert.equal(erroCapturado.name, "JsonWebTokenError");
  assert.equal(chamadasNext, 0);
  assert.equal(buscarAdministrador.mock.calls.length, 0);
});

test("repassa token expirado para o tratamento de erro", async (t) => {
  t.mock.method(jwt, "verify", () => {
    throw new jwt.TokenExpiredError("jwt expired", new Date("2026-01-01T00:00:00.000Z"));
  });

  const { erroCapturado, chamadasNext } = await executarMiddleware(
    autenticarAdministrador,
    { headers: { authorization: "Bearer token-expirado" } },
  );

  assert.equal(erroCapturado.name, "TokenExpiredError");
  assert.equal(chamadasNext, 0);
});

test("nega autorizacao administrativa para administrador inativo", async (t) => {
  t.mock.method(jwt, "verify", () => ({ sub: "1" }));
  t.mock.method(Admin, "findByPk", async () => ({ id: 1, status: ADMIN_STATUS.INATIVO }));

  const { erroCapturado, chamadasNext } = await executarMiddleware(
    autenticarAdministrador,
    { headers: { authorization: "Bearer token-valido" } },
  );

  assert.ok(erroCapturado instanceof ErroDaAplicacao);
  assert.equal(erroCapturado.status, 401);
  assert.equal(chamadasNext, 0);
});
