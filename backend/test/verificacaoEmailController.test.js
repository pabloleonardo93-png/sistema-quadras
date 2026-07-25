import assert from "node:assert/strict";
import test from "node:test";
import VerificacaoEmail from "../src/models/VerificacaoEmail.js";
import { emailVerificacaoCookieNome } from "../src/config/verificacaoEmail.js";
import { VERIFICACAO_EMAIL_STATUS } from "../src/shared/constants/verificacaoEmailStatus.js";

process.env.EMAIL_VERIFICATION_PROVIDER = "mock";

const { confirmarCodigo, obterSessao } = await import("../src/modules/verificacao-email/verificacaoEmail.controller.js");
const { validarConfirmacaoCodigo } = await import("../src/modules/verificacao-email/verificacaoEmail.validation.js");
const { criarHashVerificacao } = await import("../src/services/verificacaoEmailService.js");

function respostaFake() {
  return {
    statusCode: 200,
    payload: null,
    cookies: [],
    cookiesLimpos: [],
    status(codigo) {
      this.statusCode = codigo;
      return this;
    },
    json(payload) {
      this.payload = payload;
      return this;
    },
    cookie(nome, valor, opcoes) {
      this.cookies.push({ nome, valor, opcoes });
      return this;
    },
    clearCookie(nome, opcoes) {
      this.cookiesLimpos.push({ nome, opcoes });
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

test("confirmacao cria sessao e cookie HttpOnly", async (t) => {
  const jwtSecretOriginal = process.env.JWT_SECRET;
  process.env.JWT_SECRET = "segredo-de-teste";
  t.after(() => {
    if (jwtSecretOriginal === undefined) delete process.env.JWT_SECRET;
    else process.env.JWT_SECRET = jwtSecretOriginal;
  });

  const verificacao = {
    id: 31,
    email: "cliente@teste.com",
    codigoHash: criarHashVerificacao("123456"),
    tentativas: 0,
    expiraEm: new Date(Date.now() + 60_000),
    validadoEm: null,
    tokenExpiraEm: null,
    update: t.mock.fn(async function update(dados) {
      Object.assign(verificacao, dados);
    }),
  };
  t.mock.method(VerificacaoEmail, "findOne", async () => verificacao);

  const { resposta, erroCapturado } = await executarController(
    confirmarCodigo,
    {
      headers: {},
      body: { email: "Cliente@Teste.com", codigo: "123456" },
      ip: "127.0.0.1",
    },
    [validarConfirmacaoCodigo],
  );

  assert.equal(erroCapturado, null);
  assert.equal(resposta.payload.mensagem, "E-mail validado com sucesso.");
  assert.equal(resposta.payload.email, "cliente@teste.com");
  assert.ok(resposta.payload.token);
  assert.equal(resposta.cookies[0].nome, emailVerificacaoCookieNome);
  assert.equal(resposta.cookies[0].valor, resposta.payload.token);
  assert.equal(resposta.cookies[0].opcoes.httpOnly, true);
  assert.equal(resposta.cookies[0].opcoes.sameSite, "lax");
  assert.equal(resposta.cookies[0].opcoes.path, "/");
  assert.equal(verificacao.status, VERIFICACAO_EMAIL_STATUS.VALIDADO);
});

test("consulta sessao confirmada pelo token atual", async (t) => {
  const jwtSecretOriginal = process.env.JWT_SECRET;
  process.env.JWT_SECRET = "segredo-de-teste";
  t.after(() => {
    if (jwtSecretOriginal === undefined) delete process.env.JWT_SECRET;
    else process.env.JWT_SECRET = jwtSecretOriginal;
  });

  const verificacao = {
    id: 32,
    email: "cliente@teste.com",
    codigoHash: criarHashVerificacao("123456"),
    tentativas: 0,
    expiraEm: new Date(Date.now() + 60_000),
    validadoEm: null,
    tokenExpiraEm: null,
    update: t.mock.fn(async function update(dados) {
      Object.assign(verificacao, dados);
    }),
  };
  t.mock.method(VerificacaoEmail, "findOne", async () => verificacao);

  const confirmacao = await executarController(
    confirmarCodigo,
    {
      headers: {},
      body: { email: "cliente@teste.com", codigo: "123456" },
      ip: "127.0.0.1",
    },
    [validarConfirmacaoCodigo],
  );

  const { resposta, erroCapturado } = await executarController(obterSessao, {
    headers: { "x-email-verification-token": confirmacao.resposta.payload.token },
    body: {},
  });

  assert.equal(erroCapturado, null);
  assert.equal(resposta.payload.verificado, true);
  assert.equal(resposta.payload.email, "cliente@teste.com");
  assert.equal(resposta.payload.validadoEm, verificacao.validadoEm);
  assert.equal(resposta.payload.tokenExpiraEm, verificacao.tokenExpiraEm);
});
