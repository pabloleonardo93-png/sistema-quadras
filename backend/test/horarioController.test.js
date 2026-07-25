import assert from "node:assert/strict";
import test from "node:test";
import Horario from "../src/models/Horario.js";
import LogSistema from "../src/models/LogSistema.js";
import Quadra from "../src/models/Quadra.js";
import { HORARIO_STATUS, QUADRA_STATUS } from "../src/shared/constants/statusAdministrativos.js";
import { criar } from "../src/modules/horarios/horario.controller.js";
import { validarCriacaoHorario } from "../src/modules/horarios/horario.validation.js";
import ErroDaAplicacao from "../src/utils/ErroDaAplicacao.js";

async function executarController(handler, req, validation) {
  const resposta = {
    statusCode: 200,
    payload: null,
    status(codigo) {
      this.statusCode = codigo;
      return this;
    },
    json(payload) {
      this.payload = payload;
      return this;
    },
  };

  let erroCapturado = null;
  if (validation) {
    validation(req, resposta, (erro) => {
      if (erro) erroCapturado = erro;
    });
  }

  if (erroCapturado) return { resposta, erroCapturado };

  return handler(req, resposta, (erro) => {
    erroCapturado = erro;
  }).then(() => ({ resposta, erroCapturado }));
}

function reqHorario(overrides = {}) {
  return {
    body: {
      quadraId: 20,
      data: "2099-01-06",
      horaInicio: "18:00",
      horaFim: "19:00",
      ...overrides.body,
    },
    admin: { id: 1 },
    ip: "127.0.0.1",
    ...overrides,
  };
}

test("cria horario para quadra ativa em dia de funcionamento", async (t) => {
  const horarioCriado = {
    id: 40,
    quadraId: 20,
    data: "2099-01-06",
    horaInicio: "18:00",
    horaFim: "19:00",
    status: HORARIO_STATUS.DISPONIVEL,
  };

  t.mock.method(Quadra, "findByPk", async () => ({ id: 20, status: QUADRA_STATUS.ATIVA }));
  t.mock.method(Horario, "findOne", async () => null);
  const createMock = t.mock.method(Horario, "create", async () => horarioCriado);
  const logMock = t.mock.method(LogSistema, "create", async () => ({}));

  const { resposta, erroCapturado } = await executarController(criar, reqHorario(), validarCriacaoHorario);

  assert.equal(erroCapturado, null);
  assert.equal(resposta.statusCode, 201);
  assert.equal(resposta.payload.horario, horarioCriado);
  assert.deepEqual(createMock.mock.calls[0].arguments[0], {
    quadraId: 20,
    data: "2099-01-06",
    horaInicio: "18:00",
    horaFim: "19:00",
  });
  assert.equal(logMock.mock.calls[0].arguments[0].acao, "horario_criado");
});

test("bloqueia criacao de horarios duplicados", async (t) => {
  t.mock.method(Quadra, "findByPk", async () => ({ id: 20, status: QUADRA_STATUS.ATIVA }));
  t.mock.method(Horario, "findOne", async () => ({ id: 99 }));
  const createMock = t.mock.method(Horario, "create", async () => ({}));

  const { resposta, erroCapturado } = await executarController(criar, reqHorario(), validarCriacaoHorario);

  assert.equal(resposta.statusCode, 200);
  assert.ok(erroCapturado instanceof ErroDaAplicacao);
  assert.equal(erroCapturado.status, 409);
  assert.equal(createMock.mock.calls.length, 0);
});
