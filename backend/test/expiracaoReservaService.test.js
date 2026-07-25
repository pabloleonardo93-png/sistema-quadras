import assert from "node:assert/strict";
import test from "node:test";
import { Op } from "sequelize";
import sequelize from "../src/config/database.js";
import Horario from "../src/models/Horario.js";
import LogSistema from "../src/models/LogSistema.js";
import Reserva from "../src/models/Reserva.js";
import { PAGAMENTO_STATUS } from "../src/shared/constants/pagamentoStatus.js";
import { RESERVA_STATUS } from "../src/shared/constants/reservaStatus.js";
import { HORARIO_STATUS } from "../src/shared/constants/statusAdministrativos.js";
import { expirarReservasPendentes } from "../src/modules/reservas/expiracaoReserva.service.js";
import * as expiracaoReservaServiceFacade from "../src/services/expiracaoReservaService.js";

const transaction = { LOCK: { UPDATE: "UPDATE" } };

test("expira reservas pendentes com pagamento vencido e libera horarios", async (t) => {
  t.mock.method(sequelize, "transaction", async (callback) => callback(transaction));

  const pagamentoCriadoEm = new Date("2026-07-11T10:00:00.000Z");
  const reserva = {
    id: 50,
    horarioId: 40,
    pagamentoCriadoEm,
    update: t.mock.fn(async () => {}),
  };
  const buscarReservasMock = t.mock.method(Reserva, "findAll", async () => [reserva]);
  const horarioUpdateMock = t.mock.method(Horario, "update", async () => [1]);
  const logMock = t.mock.method(LogSistema, "create", async () => ({}));

  const resultado = await expirarReservasPendentes({
    agora: new Date("2026-07-11T10:11:00.000Z"),
    limite: 25,
  });

  assert.deepEqual(resultado, { expiradas: 1 });
  assert.deepEqual(buscarReservasMock.mock.calls[0].arguments[0].where, {
    status: RESERVA_STATUS.AGUARDANDO_PAGAMENTO,
    pagamentoStatus: PAGAMENTO_STATUS.PENDENTE,
    pagamentoCriadoEm: { [Op.ne]: null, [Op.lte]: new Date("2026-07-11T10:01:00.000Z") },
  });
  assert.equal(buscarReservasMock.mock.calls[0].arguments[0].limit, 25);
  assert.deepEqual(reserva.update.mock.calls[0].arguments, [
    {
      status: RESERVA_STATUS.EXPIRADA,
      pagamentoStatus: PAGAMENTO_STATUS.CANCELADO,
    },
    { transaction },
  ]);
  assert.deepEqual(horarioUpdateMock.mock.calls[0].arguments, [
    { status: HORARIO_STATUS.DISPONIVEL },
    { where: { id: reserva.horarioId }, transaction },
  ]);
  assert.equal(logMock.mock.calls[0].arguments[0].acao, "reserva_expirada");
});

test("mantem a fachada de expiracao compativel com o agendador existente", () => {
  assert.equal(expiracaoReservaServiceFacade.expirarReservasPendentes, expirarReservasPendentes);
});
