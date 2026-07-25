import assert from "node:assert/strict";
import test from "node:test";
import jwt from "jsonwebtoken";
import Admin from "../src/models/Admin.js";
import Comunicado from "../src/models/Comunicado.js";
import LogSistema from "../src/models/LogSistema.js";
import { autenticarAdministrador } from "../src/middlewares/authMiddleware.js";
import {
  arquivar,
  atualizar,
  buscarPorId,
  criar,
  listar,
  listarPublicos,
  publicar,
} from "../src/modules/comunicados/comunicado.controller.js";
import {
  validarDadosComunicado,
  validarFiltroComunicados,
  validarIdComunicado,
} from "../src/modules/comunicados/comunicado.validation.js";
import { ADMIN_STATUS, COMUNICADO_STATUS } from "../src/shared/constants/statusAdministrativos.js";
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

function reqComunicado(overrides = {}) {
  return {
    headers: {},
    body: {
      titulo: "Aviso importante",
      mensagem: "Mensagem do comunicado",
      destaque: true,
    },
    params: {},
    query: {},
    admin: { id: 1 },
    ip: "127.0.0.1",
    ...overrides,
  };
}

test("lista comunicados publicos sem autenticacao", async (t) => {
  const comunicados = [{ id: 1, status: COMUNICADO_STATUS.PUBLICADO, destaque: true }];
  const findAllMock = t.mock.method(Comunicado, "findAll", async () => comunicados);

  const { resposta, erroCapturado } = await executarController(listarPublicos, reqComunicado());

  assert.equal(erroCapturado, null);
  assert.deepEqual(resposta.payload, { comunicados });
  assert.deepEqual(findAllMock.mock.calls[0].arguments[0], {
    where: { status: COMUNICADO_STATUS.PUBLICADO },
    order: [["destaque", "DESC"], ["publicadoEm", "DESC"]],
  });
});

test("cria comunicado administrativo", async (t) => {
  const comunicado = { id: 10, titulo: "Aviso importante" };
  const createMock = t.mock.method(Comunicado, "create", async () => comunicado);
  const logMock = t.mock.method(LogSistema, "create", async () => ({}));

  const { resposta, erroCapturado } = await executarController(
    criar,
    reqComunicado(),
    [validarDadosComunicado],
  );

  assert.equal(erroCapturado, null);
  assert.equal(resposta.statusCode, 201);
  assert.equal(resposta.payload.mensagem, "Comunicado criado com sucesso.");
  assert.equal(resposta.payload.comunicado, comunicado);
  assert.deepEqual(createMock.mock.calls[0].arguments[0], {
    titulo: "Aviso importante",
    mensagem: "Mensagem do comunicado",
    destaque: true,
  });
  assert.equal(logMock.mock.calls[0].arguments[0].acao, "comunicado_criado");
});

test("lista comunicados administrativos com filtro de status", async (t) => {
  const comunicados = [{ id: 20, status: COMUNICADO_STATUS.RASCUNHO }];
  const findAllMock = t.mock.method(Comunicado, "findAll", async () => comunicados);

  const { resposta, erroCapturado } = await executarController(
    listar,
    reqComunicado({ query: { status: COMUNICADO_STATUS.RASCUNHO } }),
    [validarFiltroComunicados],
  );

  assert.equal(erroCapturado, null);
  assert.deepEqual(resposta.payload, { comunicados });
  assert.deepEqual(findAllMock.mock.calls[0].arguments[0], {
    where: { status: COMUNICADO_STATUS.RASCUNHO },
    order: [["criadoEm", "DESC"]],
  });
});

test("atualiza comunicado administrativo", async (t) => {
  const comunicado = {
    id: 30,
    titulo: "Antigo",
    update: t.mock.fn(async (dados) => Object.assign(comunicado, dados)),
  };
  t.mock.method(Comunicado, "findByPk", async () => comunicado);
  const logMock = t.mock.method(LogSistema, "create", async () => ({}));

  const { resposta, erroCapturado } = await executarController(
    atualizar,
    reqComunicado({
      params: { id: "30" },
      body: { titulo: "Atualizado", mensagem: "Texto atualizado", destaque: false },
    }),
    [validarIdComunicado, validarDadosComunicado],
  );

  assert.equal(erroCapturado, null);
  assert.equal(resposta.payload.mensagem, "Comunicado atualizado com sucesso.");
  assert.deepEqual(comunicado.update.mock.calls[0].arguments[0], {
    titulo: "Atualizado",
    mensagem: "Texto atualizado",
    destaque: false,
  });
  assert.equal(logMock.mock.calls[0].arguments[0].acao, "comunicado_atualizado");
});

test("publica comunicado administrativo", async (t) => {
  const comunicado = {
    id: 40,
    status: COMUNICADO_STATUS.RASCUNHO,
    publicadoEm: null,
    update: t.mock.fn(async (dados) => Object.assign(comunicado, dados)),
  };
  t.mock.method(Comunicado, "findByPk", async () => comunicado);
  const logMock = t.mock.method(LogSistema, "create", async () => ({}));

  const { resposta, erroCapturado } = await executarController(
    publicar,
    reqComunicado({ params: { id: "40" } }),
    [validarIdComunicado],
  );

  assert.equal(erroCapturado, null);
  assert.equal(resposta.payload.mensagem, "Comunicado publicado com sucesso.");
  assert.equal(comunicado.update.mock.calls[0].arguments[0].status, COMUNICADO_STATUS.PUBLICADO);
  assert.ok(comunicado.update.mock.calls[0].arguments[0].publicadoEm instanceof Date);
  assert.equal(logMock.mock.calls[0].arguments[0].acao, "comunicado_publicado");
});

test("arquiva comunicado administrativo mantendo data de publicacao", async (t) => {
  const publicadoEm = new Date("2026-07-25T12:00:00.000Z");
  const comunicado = {
    id: 41,
    status: COMUNICADO_STATUS.PUBLICADO,
    publicadoEm,
    update: t.mock.fn(async (dados) => Object.assign(comunicado, dados)),
  };
  t.mock.method(Comunicado, "findByPk", async () => comunicado);
  const logMock = t.mock.method(LogSistema, "create", async () => ({}));

  const { resposta, erroCapturado } = await executarController(
    arquivar,
    reqComunicado({ params: { id: "41" } }),
    [validarIdComunicado],
  );

  assert.equal(erroCapturado, null);
  assert.equal(resposta.payload.mensagem, "Comunicado arquivado com sucesso.");
  assert.deepEqual(comunicado.update.mock.calls[0].arguments[0], {
    status: COMUNICADO_STATUS.ARQUIVADO,
    publicadoEm,
  });
  assert.equal(logMock.mock.calls[0].arguments[0].acao, "comunicado_arquivado");
});

test("nega acesso administrativo sem autenticacao", async () => {
  const { erroCapturado, chamadasNext } = await executarMiddleware(autenticarAdministrador, { headers: {} });

  assert.ok(erroCapturado instanceof ErroDaAplicacao);
  assert.equal(erroCapturado.status, 401);
  assert.equal(chamadasNext, 0);
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

test("retorna erro para comunicado inexistente", async (t) => {
  t.mock.method(Comunicado, "findByPk", async () => null);

  const { erroCapturado } = await executarController(
    buscarPorId,
    reqComunicado({ params: { id: "99" } }),
    [validarIdComunicado],
  );

  assert.ok(erroCapturado instanceof ErroDaAplicacao);
  assert.equal(erroCapturado.status, 404);
});

test("rejeita id invalido antes de consultar comunicado", async (t) => {
  const findByPkMock = t.mock.method(Comunicado, "findByPk", async () => ({}));

  const { erroCapturado } = await executarController(
    buscarPorId,
    reqComunicado({ params: { id: "abc" } }),
    [validarIdComunicado],
  );

  assert.ok(erroCapturado instanceof ErroDaAplicacao);
  assert.equal(erroCapturado.status, 400);
  assert.equal(findByPkMock.mock.calls.length, 0);
});

test("rejeita dados invalidos antes de criar comunicado", async (t) => {
  const createMock = t.mock.method(Comunicado, "create", async () => ({}));

  const { erroCapturado } = await executarController(
    criar,
    reqComunicado({ body: { titulo: "", mensagem: "" } }),
    [validarDadosComunicado],
  );

  assert.ok(erroCapturado instanceof ErroDaAplicacao);
  assert.equal(erroCapturado.status, 400);
  assert.equal(createMock.mock.calls.length, 0);
});

test("rejeita filtro de status invalido antes de listar", async (t) => {
  const findAllMock = t.mock.method(Comunicado, "findAll", async () => []);

  const { erroCapturado } = await executarController(
    listar,
    reqComunicado({ query: { status: "invalido" } }),
    [validarFiltroComunicados],
  );

  assert.ok(erroCapturado instanceof ErroDaAplicacao);
  assert.equal(erroCapturado.status, 400);
  assert.equal(findAllMock.mock.calls.length, 0);
});
