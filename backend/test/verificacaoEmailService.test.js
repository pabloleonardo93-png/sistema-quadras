import assert from "node:assert/strict";
import test from "node:test";
import jwt from "jsonwebtoken";
import VerificacaoEmail from "../src/models/VerificacaoEmail.js";
import { VERIFICACAO_EMAIL_STATUS } from "../src/shared/constants/verificacaoEmailStatus.js";
import ErroDaAplicacao from "../src/utils/ErroDaAplicacao.js";

process.env.EMAIL_VERIFICATION_PROVIDER = "mock";

const {
  confirmarCodigoEmail,
  criarHashVerificacao,
  solicitarCodigoEmail,
  validarTokenTemporarioEmail,
} = await import("../src/services/verificacaoEmailService.js");

function mockJwtSecret(t) {
  const jwtSecretOriginal = process.env.JWT_SECRET;
  process.env.JWT_SECRET = "segredo-de-teste";
  t.after(() => {
    if (jwtSecretOriginal === undefined) delete process.env.JWT_SECRET;
    else process.env.JWT_SECRET = jwtSecretOriginal;
  });
}

test("solicita codigo de verificacao sem enviar e-mail real", async (t) => {
  const verificacao = { id: 10, update: t.mock.fn(async () => {}) };
  const updateMock = t.mock.method(VerificacaoEmail, "update", async () => [1]);
  t.mock.method(VerificacaoEmail, "findOne", async () => null);
  t.mock.method(VerificacaoEmail, "count", async () => 0);
  const createMock = t.mock.method(VerificacaoEmail, "create", async () => verificacao);

  const resultado = await solicitarCodigoEmail({
    email: "Cliente@Teste.com",
    enderecoIp: "127.0.0.1",
    userAgent: "Teste",
  });

  assert.equal(resultado.email, "cliente@teste.com");
  assert.equal(resultado.validadeMinutos, 10);
  assert.equal(resultado.intervaloReenvioSegundos, 60);
  assert.equal(updateMock.mock.calls[0].arguments[0].status, VERIFICACAO_EMAIL_STATUS.EXPIRADO);
  assert.equal(updateMock.mock.calls[1].arguments[0].status, VERIFICACAO_EMAIL_STATUS.EXPIRADO);
  assert.equal(createMock.mock.calls[0].arguments[0].email, "cliente@teste.com");
  assert.equal(createMock.mock.calls[0].arguments[0].status, VERIFICACAO_EMAIL_STATUS.PENDENTE);
  assert.match(createMock.mock.calls[0].arguments[0].codigoHash, /^[a-f0-9]{64}$/);
});

test("confirma codigo de e-mail e valida token temporario", async (t) => {
  mockJwtSecret(t);

  const email = "cliente@teste.com";
  const codigo = "123456";
  const verificacao = {
    id: 10,
    email,
    codigoHash: criarHashVerificacao(codigo),
    tentativas: 0,
    expiraEm: new Date(Date.now() + 60_000),
    validadoEm: null,
    tokenExpiraEm: null,
    update: t.mock.fn(async function update(dados) {
      Object.assign(verificacao, dados);
    }),
  };
  const findMock = t.mock.method(VerificacaoEmail, "findOne", async () => verificacao);

  const confirmacao = await confirmarCodigoEmail({ email, codigo });

  assert.equal(confirmacao.email, email);
  assert.ok(confirmacao.token);
  assert.equal(verificacao.status, VERIFICACAO_EMAIL_STATUS.VALIDADO);
  assert.match(verificacao.tokenHash, /^[a-f0-9]{64}$/);

  findMock.mock.mockImplementation(async () => verificacao);
  const sessao = await validarTokenTemporarioEmail({ token: confirmacao.token });

  assert.equal(sessao.email, email);
  assert.equal(sessao.verificacaoId, verificacao.id);
  assert.equal(sessao.token, confirmacao.token);
  assert.equal(findMock.mock.calls[1].arguments[0].where.status, VERIFICACAO_EMAIL_STATUS.VALIDADO);
});

test("rejeita codigo invalido e registra tentativa", async (t) => {
  const verificacao = {
    id: 11,
    email: "cliente@teste.com",
    codigoHash: criarHashVerificacao("123456"),
    tentativas: 0,
    expiraEm: new Date(Date.now() + 60_000),
    update: t.mock.fn(async function update(dados) {
      Object.assign(verificacao, dados);
    }),
  };
  t.mock.method(VerificacaoEmail, "findOne", async () => verificacao);

  await assert.rejects(
    () => confirmarCodigoEmail({ email: "cliente@teste.com", codigo: "654321" }),
    (erro) => erro instanceof ErroDaAplicacao && erro.status === 400,
  );

  assert.deepEqual(verificacao.update.mock.calls[0].arguments[0], {
    tentativas: 1,
    status: VERIFICACAO_EMAIL_STATUS.PENDENTE,
  });
});

test("expira codigo vencido durante confirmacao", async (t) => {
  const verificacao = {
    id: 12,
    email: "cliente@teste.com",
    codigoHash: criarHashVerificacao("123456"),
    tentativas: 0,
    expiraEm: new Date(Date.now() - 60_000),
    update: t.mock.fn(async function update(dados) {
      Object.assign(verificacao, dados);
    }),
  };
  t.mock.method(VerificacaoEmail, "findOne", async () => verificacao);

  await assert.rejects(
    () => confirmarCodigoEmail({ email: "cliente@teste.com", codigo: "123456" }),
    (erro) => erro instanceof ErroDaAplicacao && erro.status === 410,
  );

  assert.deepEqual(verificacao.update.mock.calls[0].arguments[0], {
    status: VERIFICACAO_EMAIL_STATUS.EXPIRADO,
  });
});

test("bloqueia confirmacao acima do limite de tentativas", async (t) => {
  const verificacao = {
    id: 13,
    email: "cliente@teste.com",
    codigoHash: criarHashVerificacao("123456"),
    tentativas: 5,
    expiraEm: new Date(Date.now() + 60_000),
    update: t.mock.fn(async function update(dados) {
      Object.assign(verificacao, dados);
    }),
  };
  t.mock.method(VerificacaoEmail, "findOne", async () => verificacao);

  await assert.rejects(
    () => confirmarCodigoEmail({ email: "cliente@teste.com", codigo: "123456" }),
    (erro) => erro instanceof ErroDaAplicacao && erro.status === 429,
  );

  assert.deepEqual(verificacao.update.mock.calls[0].arguments[0], {
    status: VERIFICACAO_EMAIL_STATUS.BLOQUEADO,
  });
});

test("bloqueia reenvio antes do tempo permitido", async (t) => {
  const ultimaVerificacao = {
    reenvioLiberadoEm: new Date(Date.now() + 60_000),
  };
  t.mock.method(VerificacaoEmail, "update", async () => [1]);
  t.mock.method(VerificacaoEmail, "findOne", async () => ultimaVerificacao);
  const countMock = t.mock.method(VerificacaoEmail, "count", async () => 0);
  const createMock = t.mock.method(VerificacaoEmail, "create", async () => ({}));

  await assert.rejects(
    () => solicitarCodigoEmail({
      email: "cliente@teste.com",
      enderecoIp: "127.0.0.1",
      userAgent: "Teste",
    }),
    (erro) => erro instanceof ErroDaAplicacao && erro.status === 429,
  );

  assert.equal(countMock.mock.calls.length, 0);
  assert.equal(createMock.mock.calls.length, 0);
});

test("falha quando sessao validada nao existe mais", async (t) => {
  mockJwtSecret(t);

  const token = jwt.sign(
    {
      tipo: "email_verificado",
      verificacaoId: 99,
      email: "cliente@teste.com",
    },
    process.env.JWT_SECRET,
    { expiresIn: 60 },
  );
  t.mock.method(VerificacaoEmail, "findOne", async () => null);

  await assert.rejects(
    () => validarTokenTemporarioEmail({ token }),
    (erro) => erro instanceof ErroDaAplicacao && erro.status === 403,
  );
});
