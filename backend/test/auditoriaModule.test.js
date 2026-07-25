import assert from "node:assert/strict";
import test from "node:test";
import jwt from "jsonwebtoken";
import Admin from "../src/models/Admin.js";
import LogSistema from "../src/models/LogSistema.js";
import { autenticarAdministrador } from "../src/middlewares/authMiddleware.js";
import { buscarPorId, listar } from "../src/modules/auditoria/auditoria.controller.js";
import { validarIdLog, validarListagemLogs } from "../src/modules/auditoria/auditoria.validation.js";
import { registrarLog as registrarLogCompartilhado } from "../src/shared/audit/registrarLog.js";
import { registrarLog as registrarLogCompatibilidade } from "../src/services/logService.js";
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

function reqAuditoria(overrides = {}) {
  return {
    headers: {},
    params: {},
    query: {},
    admin: { id: 1 },
    ...overrides,
  };
}

test("lista logs administrativos com paginacao e ordenacao preservadas", async (t) => {
  const logs = [{ id: 1, acao: "login_realizado" }];
  const findAndCountAllMock = t.mock.method(LogSistema, "findAndCountAll", async () => ({
    rows: logs,
    count: 12,
  }));

  const { resposta, erroCapturado } = await executarController(
    listar,
    reqAuditoria({ query: { pagina: "2", limite: "25" } }),
    [validarListagemLogs],
  );

  assert.equal(erroCapturado, null);
  assert.equal(resposta.statusCode, 200);
  assert.deepEqual(resposta.payload, { pagina: 2, limite: 25, total: 12, logs });
  assert.equal(findAndCountAllMock.mock.calls[0].arguments[0].include[0].model, Admin);
  assert.deepEqual(findAndCountAllMock.mock.calls[0].arguments[0].include[0].attributes, ["id", "nome", "email"]);
  assert.deepEqual(findAndCountAllMock.mock.calls[0].arguments[0].order, [["criadoEm", "DESC"]]);
  assert.equal(findAndCountAllMock.mock.calls[0].arguments[0].limit, 25);
  assert.equal(findAndCountAllMock.mock.calls[0].arguments[0].offset, 25);
});

test("mantem coercao atual para query de paginacao invalida ou fora do limite", async (t) => {
  const findAndCountAllMock = t.mock.method(LogSistema, "findAndCountAll", async () => ({
    rows: [],
    count: 0,
  }));

  const { resposta, erroCapturado } = await executarController(
    listar,
    reqAuditoria({ query: { pagina: "-4", limite: "999" } }),
    [validarListagemLogs],
  );

  assert.equal(erroCapturado, null);
  assert.equal(resposta.payload.pagina, 1);
  assert.equal(resposta.payload.limite, 100);
  assert.equal(findAndCountAllMock.mock.calls[0].arguments[0].offset, 0);
});

test("nega acesso administrativo sem autenticacao", async () => {
  const { erroCapturado, chamadasNext } = await executarMiddleware(autenticarAdministrador, { headers: {} });

  assert.ok(erroCapturado instanceof ErroDaAplicacao);
  assert.equal(erroCapturado.status, 401);
  assert.equal(chamadasNext, 0);
});

test("permite acesso administrativo com token valido", async (t) => {
  const admin = { id: 1, status: ADMIN_STATUS.ATIVO };
  t.mock.method(jwt, "verify", () => ({ sub: String(admin.id) }));
  t.mock.method(Admin, "findByPk", async () => admin);

  const req = { headers: { authorization: "Bearer token-valido" } };
  const { erroCapturado, chamadasNext } = await executarMiddleware(autenticarAdministrador, req);

  assert.equal(erroCapturado, null);
  assert.equal(chamadasNext, 1);
  assert.equal(req.admin, admin);
});

test("busca log por id", async (t) => {
  const log = { id: 5, acao: "arquivo_enviado" };
  const findByPkMock = t.mock.method(LogSistema, "findByPk", async () => log);

  const { resposta, erroCapturado } = await executarController(
    buscarPorId,
    reqAuditoria({ params: { id: "5" } }),
    [validarIdLog],
  );

  assert.equal(erroCapturado, null);
  assert.equal(resposta.statusCode, 200);
  assert.deepEqual(resposta.payload, { log });
  assert.equal(findByPkMock.mock.calls[0].arguments[0], 5);
  assert.equal(findByPkMock.mock.calls[0].arguments[1].include[0].model, Admin);
});

test("rejeita id invalido antes de consultar log", async (t) => {
  const findByPkMock = t.mock.method(LogSistema, "findByPk", async () => ({}));

  const { erroCapturado } = await executarController(
    buscarPorId,
    reqAuditoria({ params: { id: "abc" } }),
    [validarIdLog],
  );

  assert.ok(erroCapturado instanceof ErroDaAplicacao);
  assert.equal(erroCapturado.status, 400);
  assert.equal(findByPkMock.mock.calls.length, 0);
});

test("retorna erro quando log nao existe", async (t) => {
  t.mock.method(LogSistema, "findByPk", async () => null);

  const { erroCapturado } = await executarController(
    buscarPorId,
    reqAuditoria({ params: { id: "99" } }),
    [validarIdLog],
  );

  assert.ok(erroCapturado instanceof ErroDaAplicacao);
  assert.equal(erroCapturado.status, 404);
  assert.equal(erroCapturado.message, "Log não encontrado.");
});

test("registra log valido pelo ponto compartilhado", async (t) => {
  const logCriado = { id: 10 };
  const createMock = t.mock.method(LogSistema, "create", async () => logCriado);

  const resultado = await registrarLogCompartilhado({
    adminId: 1,
    acao: "evento_teste",
    entidade: "teste",
    entidadeId: 2,
    enderecoIp: "127.0.0.1",
    detalhes: { status: "ok" },
    transaction: "tx",
  });

  assert.equal(resultado, logCriado);
  assert.deepEqual(createMock.mock.calls[0].arguments[0], {
    adminId: 1,
    acao: "evento_teste",
    entidade: "teste",
    entidadeId: 2,
    enderecoIp: "127.0.0.1",
    detalhes: { status: "ok" },
  });
  assert.deepEqual(createMock.mock.calls[0].arguments[1], { transaction: "tx" });
});

test("falha do banco ao registrar log nao interrompe o modo padrao", async (t) => {
  const consoleErrorMock = t.mock.method(console, "error", () => {});
  t.mock.method(LogSistema, "create", async () => {
    throw new Error("falha auditoria");
  });

  const resultado = await registrarLogCompartilhado({
    acao: "evento_falha",
    entidade: "teste",
    entidadeId: 4,
    detalhes: { token: "nao-deve-ir-ao-logger" },
  });

  assert.equal(resultado, null);
  assert.equal(consoleErrorMock.mock.calls.length, 1);
  assert.equal(consoleErrorMock.mock.calls[0].arguments[0], "Falha ao registrar log de auditoria.");
  assert.deepEqual(consoleErrorMock.mock.calls[0].arguments[1], {
    acao: "evento_falha",
    entidade: "teste",
    entidadeId: 4,
    erro: "Error",
    codigo: null,
  });
});

test("modo obrigatorio propaga a falha de auditoria", async (t) => {
  const consoleErrorMock = t.mock.method(console, "error", () => {});
  t.mock.method(LogSistema, "create", async () => {
    throw new Error("falha auditoria obrigatoria");
  });

  await assert.rejects(
    registrarLogCompartilhado({
      acao: "evento_obrigatorio",
      obrigatorio: true,
    }),
    /falha auditoria obrigatoria/,
  );
  assert.equal(consoleErrorMock.mock.calls.length, 1);
});

test("usa savepoint para falha nao bloqueante dentro de transacao", async (t) => {
  const consoleErrorMock = t.mock.method(console, "error", () => {});
  const savepoint = { id: "savepoint-auditoria" };
  const transaction = {
    id: "transacao-principal",
    sequelize: {
      async transaction(options, callback) {
        assert.equal(options.transaction, transaction);
        return callback(savepoint);
      },
    },
  };
  const createMock = t.mock.method(LogSistema, "create", async () => {
    throw new Error("falha no savepoint");
  });

  const operacaoPrincipal = async () => {
    await registrarLogCompartilhado({
      acao: "evento_transacional",
      transaction,
    });
    return "operacao-concluida";
  };

  assert.equal(await operacaoPrincipal(), "operacao-concluida");
  assert.equal(createMock.mock.calls[0].arguments[1].transaction, savepoint);
  assert.equal(consoleErrorMock.mock.calls.length, 1);
});

test("sanitiza chaves sensiveis aninhadas e dentro de arrays", async (t) => {
  const createMock = t.mock.method(LogSistema, "create", async () => ({}));

  await registrarLogCompartilhado({
    acao: "evento_sensivel",
    detalhes: {
      status: "ok",
      senha: "segredo",
      TOKEN: "token-secreto",
      accessToken: "access-token",
      refreshToken: "refresh-token",
      cookie: "session=segredo",
      secret: "segredo",
      client_secret: "client-secret",
      nested: {
        Authorization: "Bearer token",
        Password: "senha",
        valor: 123,
      },
      lista: [
        {
          password: "senha",
          Authorization: "Bearer outro-token",
          permitido: true,
          dados: { nome: "Cliente" },
        },
      ],
    },
  });

  assert.deepEqual(createMock.mock.calls[0].arguments[0].detalhes, {
    status: "ok",
    nested: { valor: 123 },
    lista: [{ permitido: true, dados: { nome: "Cliente" } }],
  });
});

test("preserva valores comuns e evita recursao infinita em detalhes circulares", async (t) => {
  const createMock = t.mock.method(LogSistema, "create", async () => ({}));
  const detalhes = {
    texto: "valor",
    numero: 42,
    ativo: true,
    vazio: null,
    ausente: undefined,
    lista: ["item", 7, null],
  };
  detalhes.circular = detalhes;

  await registrarLogCompartilhado({
    acao: "evento_circular",
    detalhes,
  });

  assert.deepEqual(createMock.mock.calls[0].arguments[0].detalhes, {
    texto: "valor",
    numero: 42,
    ativo: true,
    vazio: null,
    ausente: undefined,
    lista: ["item", 7, null],
    circular: "[Circular]",
  });
});

test("mantem fachada compativel em services/logService.js", async (t) => {
  const createMock = t.mock.method(LogSistema, "create", async () => ({ id: 11 }));

  await registrarLogCompatibilidade({
    acao: "evento_fachada",
    entidade: "teste",
    detalhes: { valor: 1 },
  });

  assert.equal(createMock.mock.calls.length, 1);
  assert.equal(createMock.mock.calls[0].arguments[0].acao, "evento_fachada");
  assert.equal(createMock.mock.calls[0].arguments[0].entidade, "teste");
});
