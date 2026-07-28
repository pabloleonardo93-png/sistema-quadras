import assert from "node:assert/strict";
import test from "node:test";
import {
  calcularCorteExpiracao,
  calcularPagamentoExpiraEm,
  tempoPagamentoMinutos,
} from "../src/config/pagamento.js";
import { dadosPagamentoInicial } from "../src/services/reservaService.js";

test("define dez minutos como prazo padrao para pagamento", () => {
  assert.equal(tempoPagamentoMinutos, 10);
});

test("calcula horario limite de pagamento", () => {
  const base = new Date("2026-07-11T10:00:00.000Z");
  const limite = calcularPagamentoExpiraEm(base);

  assert.equal(limite.toISOString(), "2026-07-11T10:10:00.000Z");
});

test("calcula corte para expirar reservas pendentes", () => {
  const agora = new Date("2026-07-11T10:10:00.000Z");
  const corte = calcularCorteExpiracao(agora);

  assert.equal(corte.toISOString(), "2026-07-11T10:00:00.000Z");
});

test("ignora datas invalidas para expiracao", () => {
  assert.equal(calcularPagamentoExpiraEm("data-invalida"), null);
  assert.equal(calcularCorteExpiracao("data-invalida"), null);
});

test("reserva aguardando pagamento recebe prazo desde a criacao", () => {
  const criadoEm = new Date("2026-07-11T10:00:00.000Z");
  const dados = dadosPagamentoInicial(criadoEm);

  assert.equal(dados.pagamentoCriadoEm, criadoEm);
  assert.equal(dados.pagamentoExpiraEm.toISOString(), "2026-07-11T10:10:00.000Z");
});
