import assert from "node:assert/strict";
import { once } from "node:events";
import http from "node:http";
import test from "node:test";
import express from "express";
import { criarRateLimiter } from "../src/middlewares/rateLimitMiddleware.js";

function respostaFake() {
  return {
    statusCode: 200,
    headers: {},
    body: null,
    set(nome, valor) {
      this.headers[nome] = valor;
      return this;
    },
    status(codigo) {
      this.statusCode = codigo;
      return this;
    },
    json(payload) {
      this.body = payload;
      return this;
    },
  };
}

function executar(middleware, ip) {
  const resposta = respostaFake();
  let proximo = 0;
  middleware({ ip }, resposta, () => { proximo += 1; });
  return { resposta, proximo };
}

test("aplica limite por IP, retorna 429 e libera apos a janela", () => {
  let instante = 1_000;
  const limiter = criarRateLimiter({ janelaMs: 1_000, maximo: 2, agora: () => instante });

  assert.equal(executar(limiter, "198.51.100.10").proximo, 1);
  assert.equal(executar(limiter, "198.51.100.10").proximo, 1);

  const bloqueado = executar(limiter, "198.51.100.10");
  assert.equal(bloqueado.proximo, 0);
  assert.equal(bloqueado.resposta.statusCode, 429);
  assert.deepEqual(bloqueado.resposta.body, { erro: "Muitas solicitacoes. Tente novamente mais tarde." });
  assert.equal(bloqueado.resposta.headers["Retry-After"], "1");

  assert.equal(executar(limiter, "203.0.113.22").proximo, 1);
  instante += 1_000;
  assert.equal(executar(limiter, "198.51.100.10").proximo, 1);
});

test("usa o IP encaminhado por um proxy confiavel", async (t) => {
  const app = express();
  app.set("trust proxy", 1);
  app.get("/", criarRateLimiter({ janelaMs: 60_000, maximo: 1 }), (_req, res) => res.json({ ok: true }));

  const servidor = http.createServer(app);
  servidor.listen(0, "127.0.0.1");
  await once(servidor, "listening");
  t.after(() => servidor.close());
  const baseUrl = `http://127.0.0.1:${servidor.address().port}`;

  const primeira = await fetch(baseUrl, { headers: { "X-Forwarded-For": "198.51.100.10" } });
  const bloqueada = await fetch(baseUrl, { headers: { "X-Forwarded-For": "198.51.100.10" } });
  const outroIp = await fetch(baseUrl, { headers: { "X-Forwarded-For": "203.0.113.22" } });

  assert.equal(primeira.status, 200);
  assert.equal(bloqueada.status, 429);
  assert.equal(outroIp.status, 200);
});
