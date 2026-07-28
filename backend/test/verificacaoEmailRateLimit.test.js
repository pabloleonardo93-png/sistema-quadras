import assert from "node:assert/strict";
import { once } from "node:events";
import { readFile } from "node:fs/promises";
import test, { after, before, beforeEach, mock } from "node:test";
import { Op } from "sequelize";

process.env.JWT_SECRET = "segredo-de-teste-para-rate-limit";
process.env.NODE_ENV = "test";
process.env.TRUST_PROXY_HOPS = "2";
process.env.EMAIL_VERIFICATION_PROVIDER = "mock";
process.env.EMAIL_VERIFICATION_RESEND_SECONDS = "60";
process.env.EMAIL_VERIFICATION_RATE_WINDOW_MINUTES = "60";
process.env.EMAIL_VERIFICATION_MAX_SENDS_PER_EMAIL = "3";
process.env.EMAIL_VERIFICATION_MAX_SENDS_PER_IP = "3";
process.env.EMAIL_VERIFICATION_MAX_CONFIRM_ATTEMPTS_PER_WINDOW = "7";
process.env.EMAIL_VERIFICATION_CONFIRM_RATE_WINDOW_MINUTES = "13";

const { default: app } = await import("../src/app.js");
const { default: VerificacaoEmail } = await import("../src/models/VerificacaoEmail.js");
const { default: sequelize } = await import("../src/config/database.js");
const { normalizarTrustProxyHops } = await import("../src/config/proxy.js");
const { confirmarCodigoEmail, criarHashVerificacao } = await import("../src/services/verificacaoEmailService.js");
const { limitesCriticos, OPERACOES_LIMITE } = await import("../src/services/limitePersistenteService.js");

let server;
let baseUrl;
let proximoId = 1;
let enviosEmail = 0;
const verificacoes = [];
const limitesPersistentes = new Map();

function valorComparavel(valor) {
  return valor instanceof Date ? valor.getTime() : valor;
}

function correspondeOperador(valorRegistro, condicao) {
  for (const simbolo of Object.getOwnPropertySymbols(condicao)) {
    const valorCondicao = condicao[simbolo];
    const registro = valorComparavel(valorRegistro);
    const esperado = valorComparavel(valorCondicao);

    if (simbolo === Op.gte && registro < esperado) return false;
    if (simbolo === Op.lte && registro > esperado) return false;
    if (simbolo === Op.gt && registro <= esperado) return false;
    if (simbolo === Op.lt && registro >= esperado) return false;
  }

  return true;
}

function correspondeWhere(registro, where = {}) {
  for (const [campo, condicao] of Object.entries(where)) {
    if (
      condicao &&
      typeof condicao === "object" &&
      !(condicao instanceof Date) &&
      Object.getOwnPropertySymbols(condicao).length > 0
    ) {
      if (!correspondeOperador(registro[campo], condicao)) return false;
      continue;
    }

    if (registro[campo] !== condicao) return false;
  }

  return true;
}

function verificacoesOrdenadasPorCriacaoDesc() {
  return [...verificacoes].sort((a, b) => b.criadoEm.getTime() - a.criadoEm.getTime());
}

function resetarVerificacoes() {
  verificacoes.length = 0;
  proximoId = 1;
  enviosEmail = 0;
  limitesPersistentes.clear();
}

async function postEnviar({ email, forwardedFor }) {
  const resposta = await fetch(`${baseUrl}/api/verificacao-email/enviar`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-forwarded-for": forwardedFor,
      "user-agent": "rate-limit-test",
    },
    body: JSON.stringify({ email }),
  });

  return {
    status: resposta.status,
    body: await resposta.json(),
  };
}

async function postConfirmar({ email, codigo, forwardedFor = "198.51.100.91, 172.18.0.1" }) {
  const resposta = await fetch(`${baseUrl}/api/verificacao-email/confirmar`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-forwarded-for": forwardedFor,
      "user-agent": "rate-limit-test",
    },
    body: JSON.stringify({ email, codigo }),
  });
  return { status: resposta.status, body: await resposta.json() };
}

function liberarReenvioDoUltimoRegistro() {
  verificacoes.at(-1).reenvioLiberadoEm = new Date(Date.now() - 1000);
}

before(async () => {
  mock.method(console, "info", () => {
    enviosEmail += 1;
  });

  mock.method(VerificacaoEmail, "findOne", async ({ where }) => {
    return verificacoesOrdenadasPorCriacaoDesc().find((registro) =>
      correspondeWhere(registro, where),
    ) || null;
  });

  mock.method(VerificacaoEmail, "count", async ({ where }) => {
    return verificacoes.filter((registro) => correspondeWhere(registro, where)).length;
  });

  mock.method(VerificacaoEmail, "update", async (valores, { where }) => {
    let alterados = 0;

    for (const registro of verificacoes) {
      if (correspondeWhere(registro, where)) {
        Object.assign(registro, valores);
        alterados += 1;
      }
    }

    return [alterados];
  });

  mock.method(VerificacaoEmail, "create", async (dados) => {
    const registro = {
      id: proximoId,
      ...dados,
      criadoEm: new Date(),
      atualizadoEm: new Date(),
    };
    proximoId += 1;
    registro.update = async (valores) => {
      Object.assign(registro, valores, { atualizadoEm: new Date() });
      return registro;
    };

    verificacoes.push(registro);
    return registro;
  });

  mock.method(sequelize, "transaction", async (callback) => callback({ LOCK: { UPDATE: "UPDATE" } }));
  mock.method(sequelize, "query", async (_sql, { replacements }) => {
    const chave = `${replacements.chave}:${new Date(replacements.inicioJanela).getTime()}`;
    const quantidade = limitesPersistentes.get(chave) || 0;
    if (quantidade >= replacements.limite) return [];
    limitesPersistentes.set(chave, quantidade + 1);
    return [{ quantidade: quantidade + 1 }];
  });

  server = app.listen(0, "127.0.0.1");
  await once(server, "listening");
  const { port } = server.address();
  baseUrl = `http://127.0.0.1:${port}`;
});

after(async () => {
  await new Promise((resolve, reject) => {
    server.close((erro) => (erro ? reject(erro) : resolve()));
  });
  mock.reset();
});

beforeEach(() => {
  resetarVerificacoes();
});

test("obtem o IP real do cliente atras dos proxies configurados", async () => {
  const resposta = await postEnviar({
    email: "cliente-ip-real@example.com",
    forwardedFor: "198.51.100.10, 172.18.0.1",
  });

  assert.equal(resposta.status, 201);
  assert.equal(verificacoes[0].enderecoIp, "198.51.100.10");
});

test("contabiliza IPs diferentes separadamente", async () => {
  for (const indice of [1, 2, 3]) {
    const resposta = await postEnviar({
      email: `ip-a-${indice}@example.com`,
      forwardedFor: "198.51.100.20, 172.18.0.1",
    });
    assert.equal(resposta.status, 201);
  }

  const respostaOutroIp = await postEnviar({
    email: "ip-b@example.com",
    forwardedFor: "198.51.100.21, 172.18.0.1",
  });

  assert.equal(respostaOutroIp.status, 201);
  assert.equal(verificacoes.length, 4);
});

test("bloqueia varias solicitacoes do mesmo IP mesmo com e-mails diferentes", async () => {
  for (const indice of [1, 2, 3]) {
    const resposta = await postEnviar({
      email: `mesmo-ip-${indice}@example.com`,
      forwardedFor: "198.51.100.30, 172.18.0.1",
    });
    assert.equal(resposta.status, 201);
  }

  const chamadasAntesDoBloqueio = enviosEmail;
  const respostaBloqueada = await postEnviar({
    email: "mesmo-ip-bloqueado@example.com",
    forwardedFor: "198.51.100.30, 172.18.0.1",
  });

  assert.equal(respostaBloqueada.status, 429);
  assert.equal(verificacoes.length, 3);
  assert.equal(enviosEmail, chamadasAntesDoBloqueio);
});

test("mantem o limite por e-mail mesmo com IPs diferentes", async () => {
  for (const indice of [1, 2, 3]) {
    const resposta = await postEnviar({
      email: "mesmo-email@example.com",
      forwardedFor: `198.51.100.${40 + indice}, 172.18.0.1`,
    });
    assert.equal(resposta.status, 201);
    liberarReenvioDoUltimoRegistro();
  }

  const respostaBloqueada = await postEnviar({
    email: "mesmo-email@example.com",
    forwardedFor: "198.51.100.44, 172.18.0.1",
  });

  assert.equal(respostaBloqueada.status, 429);
  assert.equal(verificacoes.length, 3);
});

test("mantem o intervalo minimo de reenvio", async () => {
  const primeiraResposta = await postEnviar({
    email: "reenvio@example.com",
    forwardedFor: "198.51.100.50, 172.18.0.1",
  });
  const chamadasAntesDoBloqueio = enviosEmail;

  const segundaResposta = await postEnviar({
    email: "reenvio@example.com",
    forwardedFor: "198.51.100.51, 172.18.0.1",
  });

  assert.equal(primeiraResposta.status, 201);
  assert.equal(segundaResposta.status, 429);
  assert.equal(verificacoes.length, 1);
  assert.equal(enviosEmail, chamadasAntesDoBloqueio);
});

test("nao chama o envio de e-mail quando a requisicao recebe 429", async () => {
  for (const indice of [1, 2, 3]) {
    const resposta = await postEnviar({
      email: `sem-email-${indice}@example.com`,
      forwardedFor: "198.51.100.60, 172.18.0.1",
    });
    assert.equal(resposta.status, 201);
  }

  const chamadasAntesDoBloqueio = enviosEmail;
  const respostaBloqueada = await postEnviar({
    email: "sem-email-bloqueado@example.com",
    forwardedFor: "198.51.100.60, 172.18.0.1",
  });

  assert.equal(respostaBloqueada.status, 429);
  assert.equal(enviosEmail, chamadasAntesDoBloqueio);
});

test("tentativas simultaneas do codigo respeitam o limite atomico", async () => {
  const verificacao = {
    id: proximoId,
    email: "concorrencia@example.com",
    codigoHash: criarHashVerificacao("123456"),
    status: "pendente",
    tentativas: 0,
    expiraEm: new Date(Date.now() + 60_000),
    criadoEm: new Date(),
    update: async (valores) => {
      Object.assign(verificacao, valores);
      return verificacao;
    },
  };
  verificacoes.push(verificacao);

  const resultados = await Promise.all(
    Array.from({ length: 8 }, () => confirmarCodigoEmail({
      email: verificacao.email,
      codigo: "000000",
      enderecoIp: "198.51.100.90",
    }).then(() => "ok", (erro) => erro.status)),
  );

  assert.equal(verificacao.tentativas, 5);
  assert.equal(verificacao.status, "bloqueado");
  assert.equal(resultados.includes("ok"), false);
  assert.equal(resultados.filter((status) => status === 429).length >= 1, true);
});

test("persiste a tentativa invalida mesmo quando a resposta HTTP e 400", async () => {
  const verificacao = {
    id: proximoId,
    email: "tentativa-salva@example.com",
    codigoHash: criarHashVerificacao("123456"),
    status: "pendente",
    tentativas: 0,
    expiraEm: new Date(Date.now() + 60_000),
    criadoEm: new Date(),
    update: async (valores) => {
      Object.assign(verificacao, valores);
      return verificacao;
    },
  };
  verificacoes.push(verificacao);

  const resposta = await postConfirmar({ email: verificacao.email, codigo: "000000" });

  assert.equal(resposta.status, 400);
  assert.equal(verificacao.tentativas, 1);
  assert.equal(verificacao.status, "pendente");
});

test("usa as variaveis especificas do limite de confirmacao", () => {
  assert.equal(OPERACOES_LIMITE.CONFIRMAR_EMAIL, "confirmarEmail");
  assert.equal(limitesCriticos.confirmarEmail.limite, 7);
  assert.equal(limitesCriticos.confirmarEmail.janelaMinutos, 13);
});

test("valores invalidos de TRUST_PROXY_HOPS nao habilitam confianca irrestrita", () => {
  assert.equal(normalizarTrustProxyHops("2"), 2);
  assert.equal(normalizarTrustProxyHops("true"), 0);
  assert.equal(normalizarTrustProxyHops("-1"), 0);
  assert.equal(normalizarTrustProxyHops("999"), 0);
});

test("nginx da borda sobrescreve X-Forwarded-For falsificado pelo cliente", async () => {
  const config = await readFile(new URL("../../nginx/vps-app.example.conf", import.meta.url), "utf8");

  assert.match(config, /proxy_set_header\s+X-Forwarded-For\s+\$remote_addr;/);
  assert.doesNotMatch(config, /proxy_set_header\s+X-Forwarded-For\s+\$proxy_add_x_forwarded_for;/);
});
