import assert from "node:assert/strict";
import test from "node:test";
import { Op } from "sequelize";
import sequelize from "../src/config/database.js";
import Cliente from "../src/models/Cliente.js";
import Horario from "../src/models/Horario.js";
import LogSistema from "../src/models/LogSistema.js";
import Modalidade from "../src/models/Modalidade.js";
import Quadra from "../src/models/Quadra.js";
import Reserva from "../src/models/Reserva.js";
import { PAGAMENTO_STATUS } from "../src/shared/constants/pagamentoStatus.js";
import { RESERVA_STATUS } from "../src/shared/constants/reservaStatus.js";
import { CLIENTE_STATUS, HORARIO_STATUS, MODALIDADE_STATUS, QUADRA_STATUS } from "../src/shared/constants/statusAdministrativos.js";
import {
  alterarStatusDaReserva,
  criarReserva,
  verificarHorarioDisponivel,
} from "../src/services/reservaService.js";
import ErroDaAplicacao from "../src/utils/ErroDaAplicacao.js";

const transaction = { LOCK: { UPDATE: "UPDATE" } };

function mockTransaction(t) {
  t.mock.method(sequelize, "transaction", async (callback) => callback(transaction));
}

test("cria reserva aguardando pagamento e bloqueia o horario", async (t) => {
  mockTransaction(t);

  const cliente = {
    id: 10,
    email: "cliente@teste.com",
    status: CLIENTE_STATUS.ATIVO,
    emailVerificadoEm: null,
    update: t.mock.fn(async () => {}),
  };
  const modalidade = { id: 30, status: MODALIDADE_STATUS.ATIVA };
  const quadra = {
    id: 20,
    status: QUADRA_STATUS.ATIVA,
    valorHora: "120.00",
    modalidades: [{ id: modalidade.id }],
  };
  const horario = {
    id: 40,
    quadraId: quadra.id,
    data: "2099-01-06",
    horaInicio: "18:00",
    horaFim: "19:00",
    status: HORARIO_STATUS.DISPONIVEL,
    update: t.mock.fn(async () => {}),
  };
  const reservaCriada = { id: 50 };
  const reservaCompleta = { id: reservaCriada.id, status: RESERVA_STATUS.AGUARDANDO_PAGAMENTO };

  t.mock.method(Cliente, "findByPk", async () => cliente);
  t.mock.method(Quadra, "findByPk", async () => quadra);
  t.mock.method(Modalidade, "findByPk", async () => modalidade);
  t.mock.method(Horario, "findByPk", async () => horario);
  t.mock.method(Reserva, "findOne", async () => null);
  const criarMock = t.mock.method(Reserva, "create", async () => reservaCriada);
  t.mock.method(Reserva, "findByPk", async () => reservaCompleta);
  const logMock = t.mock.method(LogSistema, "create", async () => ({}));

  const resultado = await criarReserva({
    clienteId: cliente.id,
    quadraId: quadra.id,
    modalidadeId: modalidade.id,
    horarioId: horario.id,
    observacoes: "  perto da rede  ",
    adminId: 1,
    enderecoIp: "127.0.0.1",
    emailVerificado: {
      email: cliente.email,
      verificacaoId: 77,
      validadoEm: new Date("2026-07-11T10:00:00.000Z"),
    },
  });

  assert.equal(resultado, reservaCompleta);
  assert.equal(criarMock.mock.calls.length, 1);
  assert.deepEqual(criarMock.mock.calls[0].arguments[0], {
    clienteId: cliente.id,
    emailVerificacaoId: 77,
    quadraId: quadra.id,
    modalidadeId: modalidade.id,
    horarioId: horario.id,
    data: horario.data,
    horaInicio: horario.horaInicio,
    horaFim: horario.horaFim,
    status: RESERVA_STATUS.AGUARDANDO_PAGAMENTO,
    valorTotal: 120,
    pagamentoStatus: PAGAMENTO_STATUS.PENDENTE,
    observacoes: "perto da rede",
  });
  assert.deepEqual(horario.update.mock.calls[0].arguments, [
    { status: HORARIO_STATUS.RESERVADO },
    { transaction },
  ]);
  assert.deepEqual(cliente.update.mock.calls[0].arguments, [
    { emailVerificadoEm: new Date("2026-07-11T10:00:00.000Z") },
    { transaction },
  ]);
  assert.equal(logMock.mock.calls[0].arguments[0].acao, "reserva_criada");
});

test("bloqueia reserva quando ja existe horario ocupado", async (t) => {
  const quadra = { id: 20 };
  const horario = {
    quadraId: quadra.id,
    data: "2099-01-06",
    horaInicio: "18:00",
    status: HORARIO_STATUS.DISPONIVEL,
  };
  const reservaExistente = { id: 99 };
  const buscarReservaMock = t.mock.method(Reserva, "findOne", async () => reservaExistente);

  await assert.rejects(
    () => verificarHorarioDisponivel({ quadra, horario, transaction }),
    (erro) => erro instanceof ErroDaAplicacao && erro.status === 409,
  );

  assert.deepEqual(buscarReservaMock.mock.calls[0].arguments[0].where, {
    quadraId: quadra.id,
    data: horario.data,
    horaInicio: horario.horaInicio,
    status: { [Op.notIn]: [RESERVA_STATUS.CANCELADA, RESERVA_STATUS.EXPIRADA] },
  });
});

test("cancela reserva e libera o horario quando pagamento ainda nao foi aprovado", async (t) => {
  mockTransaction(t);

  const reserva = {
    id: 51,
    status: RESERVA_STATUS.AGUARDANDO_PAGAMENTO,
    pagamentoStatus: PAGAMENTO_STATUS.PENDENTE,
    horarioId: 40,
    update: t.mock.fn(async () => {}),
  };
  const reservaAtualizada = { id: reserva.id, status: RESERVA_STATUS.CANCELADA };

  let chamadasFind = 0;
  t.mock.method(Reserva, "findByPk", async () => {
    chamadasFind += 1;
    return chamadasFind === 1 ? reserva : reservaAtualizada;
  });
  const horarioUpdateMock = t.mock.method(Horario, "update", async () => [1]);
  const logMock = t.mock.method(LogSistema, "create", async () => ({}));

  const resultado = await alterarStatusDaReserva({
    id: reserva.id,
    statusEsperados: [RESERVA_STATUS.AGUARDANDO_PAGAMENTO],
    novoStatus: RESERVA_STATUS.CANCELADA,
    adminId: 1,
    enderecoIp: "127.0.0.1",
  });

  assert.equal(resultado, reservaAtualizada);
  assert.deepEqual(reserva.update.mock.calls[0].arguments, [
    { status: RESERVA_STATUS.CANCELADA, pagamentoStatus: PAGAMENTO_STATUS.CANCELADO },
    { transaction },
  ]);
  assert.deepEqual(horarioUpdateMock.mock.calls[0].arguments, [
    { status: HORARIO_STATUS.DISPONIVEL },
    { where: { id: reserva.horarioId }, transaction },
  ]);
  assert.equal(logMock.mock.calls[0].arguments[0].acao, "reserva_cancelada");
});
