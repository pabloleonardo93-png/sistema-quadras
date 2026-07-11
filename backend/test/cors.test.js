import assert from "node:assert/strict";
import test from "node:test";
import {
  montarOrigensPermitidas,
  origemEstaPermitida,
} from "../src/config/cors.js";

test("monta origens de CORS a partir das urls publicas", () => {
  const permitidas = montarOrigensPermitidas({
    CORS_ORIGIN: "https://site.example.com, http://localhost:3000",
    APP_PUBLIC_URL: "https://app.example.com/reserva",
    API_PUBLIC_URL: "https://api.example.com/api",
  });

  assert.equal(permitidas.has("https://site.example.com"), true);
  assert.equal(permitidas.has("https://app.example.com"), true);
  assert.equal(permitidas.has("https://api.example.com"), true);
  assert.equal(permitidas.has("http://localhost:5173"), true);
});

test("permite requisicao da mesma host encaminhada pelo proxy", () => {
  const permitidas = montarOrigensPermitidas({ CORS_ORIGIN: "" });

  assert.equal(origemEstaPermitida({
    origem: "https://team2.class-devops-ifrs-lucca.dedyn.io:44302",
    host: "team2.class-devops-ifrs-lucca.dedyn.io:44302",
    permitidas,
  }), true);
});

test("bloqueia origem externa nao configurada", () => {
  const permitidas = montarOrigensPermitidas({
    CORS_ORIGIN: "https://team2.class-devops-ifrs-lucca.dedyn.io:44302",
  });

  assert.equal(origemEstaPermitida({
    origem: "https://externo.example.com",
    host: "team2.class-devops-ifrs-lucca.dedyn.io:44302",
    permitidas,
  }), false);
});
