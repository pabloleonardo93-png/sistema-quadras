import assert from "node:assert/strict";
import test from "node:test";
import {
  calcularExpiracaoCodigoEmail,
  calcularExpiracaoTokenEmail,
  calcularInicioJanelaEnviosEmail,
  calcularLiberacaoReenvioEmail,
  codigoEmailValidadeMinutos,
  intervaloReenvioEmailSegundos,
  maxTentativasCodigoEmail,
  sessaoEmailValidadeDias,
} from "../src/config/verificacaoEmail.js";

test("define dez minutos como validade padrao do codigo de e-mail", () => {
  assert.equal(codigoEmailValidadeMinutos, 10);
  assert.equal(maxTentativasCodigoEmail, 5);
  assert.equal(intervaloReenvioEmailSegundos, 60);
  assert.equal(sessaoEmailValidadeDias, 90);
});

test("calcula prazos da verificacao de e-mail", () => {
  const base = new Date("2026-07-11T10:00:00.000Z");

  assert.equal(calcularExpiracaoCodigoEmail(base).toISOString(), "2026-07-11T10:10:00.000Z");
  assert.equal(calcularLiberacaoReenvioEmail(base).toISOString(), "2026-07-11T10:01:00.000Z");
  assert.equal(calcularInicioJanelaEnviosEmail(base).toISOString(), "2026-07-11T09:00:00.000Z");
  assert.equal(calcularExpiracaoTokenEmail(base).toISOString(), "2026-10-09T10:00:00.000Z");
});

test("ignora datas invalidas nos prazos de verificacao", () => {
  assert.equal(calcularExpiracaoCodigoEmail("data-invalida"), null);
  assert.equal(calcularLiberacaoReenvioEmail("data-invalida"), null);
  assert.equal(calcularInicioJanelaEnviosEmail("data-invalida"), null);
  assert.equal(calcularExpiracaoTokenEmail("data-invalida"), null);
});
