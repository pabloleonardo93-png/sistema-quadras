import assert from "node:assert/strict";
import test from "node:test";
import {
  validarData,
  validarEmail,
  validarHora,
  validarId,
  validarTelefoneBrasil,
  validarTexto,
  validarValorPositivo,
} from "../src/utils/validacoes.js";

test("aceita identificadores positivos", () => {
  assert.equal(validarId("10"), 10);
});

test("rejeita identificadores invalidos", () => {
  assert.throws(() => validarId("0"), /inv/);
});

test("normaliza e valida e-mail", () => {
  assert.equal(validarEmail(" ADMIN@TESTE.COM "), "admin@teste.com");
  assert.throws(() => validarEmail("email-invalido"), /inv/);
});

test("normaliza e valida telefone brasileiro com DDD", () => {
  assert.equal(validarTelefoneBrasil("(51) 95959-5959"), "(51) 95959-5959");
  assert.equal(validarTelefoneBrasil("+55 11 99999-1234"), "(11) 99999-1234");
  assert.throws(() => validarTelefoneBrasil("99999-9999"), /DDD/);
  assert.throws(() => validarTelefoneBrasil("(00) 99999-9999"), /DDD/);
  assert.throws(() => validarTelefoneBrasil("(11) 11111-1111"), /valido/);
});

test("valida datas reais", () => {
  assert.equal(validarData("2026-06-30"), "2026-06-30");
  assert.throws(() => validarData("2026-02-30"), /inv/);
});

test("normaliza horarios", () => {
  assert.equal(validarHora("18:30:00"), "18:30");
  assert.throws(() => validarHora("24:00"), /HH:MM/);
});

test("valida textos e valores", () => {
  assert.equal(validarTexto("  Pe na Areia  ", "Nome"), "Pe na Areia");
  assert.equal(validarValorPositivo("75.50"), 75.5);
  assert.throws(() => validarValorPositivo(-1), /inv/);
});
