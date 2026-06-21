import assert from "node:assert/strict";
import test from "node:test";
import {
  validarData,
  validarEmail,
  validarHora,
  validarId,
  validarTexto,
  validarValorPositivo,
} from "../src/utils/validacoes.js";

test("aceita identificadores positivos", () => {
  assert.equal(validarId("10"), 10);
});

test("rejeita identificadores inválidos", () => {
  assert.throws(() => validarId("0"), /inválido/);
});

test("normaliza e valida e-mail", () => {
  assert.equal(validarEmail(" ADMIN@TESTE.COM "), "admin@teste.com");
  assert.throws(() => validarEmail("email-invalido"), /inválido/);
});

test("valida datas reais", () => {
  assert.equal(validarData("2026-06-30"), "2026-06-30");
  assert.throws(() => validarData("2026-02-30"), /inválida/);
});

test("normaliza horários", () => {
  assert.equal(validarHora("18:30:00"), "18:30");
  assert.throws(() => validarHora("24:00"), /HH:MM/);
});

test("valida textos e valores", () => {
  assert.equal(validarTexto("  Arena Onda  ", "Nome"), "Arena Onda");
  assert.equal(validarValorPositivo("75.50"), 75.5);
  assert.throws(() => validarValorPositivo(-1), /inválido/);
});
