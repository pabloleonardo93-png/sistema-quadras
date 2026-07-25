import assert from "node:assert/strict";
import { once } from "node:events";
import http from "node:http";
import test from "node:test";
import jwt from "jsonwebtoken";
import app from "../src/app.js";
import Admin from "../src/models/Admin.js";
import Reserva from "../src/models/Reserva.js";
import { ADMIN_STATUS } from "../src/shared/constants/statusAdministrativos.js";

async function iniciarServidor(t) {
  const servidor = http.createServer(app);
  servidor.listen(0, "127.0.0.1");
  await once(servidor, "listening");
  t.after(() => servidor.close());
  const { port } = servidor.address();
  return `http://127.0.0.1:${port}`;
}

function tokenAdministrativo(t) {
  const segredoAnterior = process.env.JWT_SECRET;
  process.env.JWT_SECRET = "segredo-de-teste";
  t.after(() => {
    if (segredoAnterior === undefined) delete process.env.JWT_SECRET;
    else process.env.JWT_SECRET = segredoAnterior;
  });
  return jwt.sign({ sub: 1 }, process.env.JWT_SECRET, { expiresIn: "1h" });
}

test("consulta publica de status preserva o contrato da reserva", async (t) => {
  const reserva = {
    id: 50,
    status: "aguardando_pagamento",
    pagamentoStatus: "pendente",
    valorTotal: 120,
    data: "2099-01-06",
    horaInicio: "18:00",
    horaFim: "19:00",
    pagamentoCriadoEm: null,
    quadra: { id: 20, nome: "Areia 1" },
    modalidade: { id: 30, nome: "Beach Tennis" },
  };
  t.mock.method(Reserva, "findByPk", async () => reserva);
  const baseUrl = await iniciarServidor(t);

  const resposta = await fetch(`${baseUrl}/api/reservas/${reserva.id}/status`);
  assert.equal(resposta.status, 200);
  assert.deepEqual(await resposta.json(), {
    reserva: {
      id: 50,
      status: "aguardando_pagamento",
      pagamentoStatus: "pendente",
      valorTotal: 120,
      data: "2099-01-06",
      horaInicio: "18:00",
      horaFim: "19:00",
      quadra: { id: 20, nome: "Areia 1" },
      modalidade: { id: 30, nome: "Beach Tennis" },
      pagamentoExpiraEm: "1970-01-01T00:10:00.000Z",
      tempoPagamentoMinutos: 10,
    },
  });
});

test("listagem administrativa preserva filtros, resposta e bloqueia acesso sem token", async (t) => {
  const baseUrl = await iniciarServidor(t);
  const semToken = await fetch(`${baseUrl}/api/reservas`);
  assert.equal(semToken.status, 401);

  const token = tokenAdministrativo(t);
  t.mock.method(Admin, "findByPk", async () => ({ id: 1, status: ADMIN_STATUS.ATIVO }));
  const listarMock = t.mock.method(Reserva, "findAll", async () => [{ id: 50 }]);
  const resposta = await fetch(`${baseUrl}/api/reservas?status=confirmada&data=2099-01-06&quadraId=20`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  assert.equal(resposta.status, 200);
  assert.deepEqual(await resposta.json(), { reservas: [{ id: 50 }] });
  assert.deepEqual(listarMock.mock.calls[0].arguments[0].where, {
    status: "confirmada",
    data: "2099-01-06",
    quadraId: 20,
  });
});
