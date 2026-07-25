import { Op } from "sequelize";
import Horario from "../models/Horario.js";
import Quadra from "../models/Quadra.js";
import Reserva from "../models/Reserva.js";
import { registrarLog } from "../services/logService.js";
import ErroDaAplicacao from "../utils/ErroDaAplicacao.js";
import executarAssincrono from "../utils/executarAssincrono.js";
import { hojeLocal, validarData, validarHora, validarId, validarStatus } from "../utils/validacoes.js";

const HORA_ABERTURA = "08:00";
const HORA_FECHAMENTO = "22:00";

function funcionaNaData(data) {
  const [ano, mes, dia] = data.split("-").map(Number);
  const diaSemana = new Date(Date.UTC(ano, mes - 1, dia)).getUTCDay();
  return diaSemana !== 1;
}

export const criar = executarAssincrono(async (req, res) => {
  const quadraId = validarId(req.body.quadraId, "Quadra");
  const quadra = await Quadra.findByPk(quadraId);
  if (!quadra || quadra.status !== "ativa") {
    throw new ErroDaAplicacao("Quadra não encontrada ou indisponível.", 409);
  }
  const data = validarData(req.body.data);
  if (data < hojeLocal()) throw new ErroDaAplicacao("Não é possível criar um horário em uma data passada.");
  if (!funcionaNaData(data)) throw new ErroDaAplicacao("O funcionamento é de terça a domingo.", 409);
  const horaInicio = validarHora(req.body.horaInicio, "Hora inicial");
  const horaFim = validarHora(req.body.horaFim, "Hora final");
  if (horaFim <= horaInicio) throw new ErroDaAplicacao("A hora final deve ser posterior à hora inicial.");
  if (horaInicio < HORA_ABERTURA || horaInicio >= HORA_FECHAMENTO || horaFim > HORA_FECHAMENTO) {
    throw new ErroDaAplicacao("O funcionamento é de 08:00 às 22:00.", 409);
  }

  const existente = await Horario.findOne({ where: { quadraId, data, horaInicio } });
  if (existente) throw new ErroDaAplicacao("Já existe um horário para essa quadra nessa data e hora.", 409);
  const horario = await Horario.create({ quadraId, data, horaInicio, horaFim });
  await registrarLog({
    adminId: req.admin.id,
    acao: "horario_criado",
    entidade: "horario",
    entidadeId: horario.id,
    enderecoIp: req.ip,
  });
  res.status(201).json({ mensagem: "Horário criado com sucesso.", horario });
});

export const listar = executarAssincrono(async (req, res) => {
  const where = {};
  const quadraId = req.query.quadraId || req.query.quadra_id;
  if (quadraId) where.quadraId = validarId(quadraId, "Quadra");
  if (req.query.data) where.data = validarData(req.query.data);
  if (req.query.status) {
    where.status = validarStatus(req.query.status, ["disponivel", "reservado", "bloqueado"]);
  }
  const horarios = await Horario.findAll({
    where,
    include: [{ model: Quadra, as: "quadra" }],
    order: [["data", "ASC"], ["horaInicio", "ASC"]],
  });
  res.json({ horarios });
});

export const listarDisponiveis = executarAssincrono(async (req, res) => {
  const where = {
    status: "disponivel",
    horaInicio: { [Op.gte]: HORA_ABERTURA, [Op.lt]: HORA_FECHAMENTO },
  };
  const quadraId = req.query.quadraId || req.query.quadra_id;
  if (quadraId) where.quadraId = validarId(quadraId, "Quadra");
  where.data = req.query.data ? validarData(req.query.data) : { [Op.gte]: hojeLocal() };
  const horarios = await Horario.findAll({
    where,
    include: [{ model: Quadra, as: "quadra", where: { status: "ativa" } }],
    order: [["data", "ASC"], ["horaInicio", "ASC"]],
  });
  res.json({ horarios: horarios.filter((horario) => funcionaNaData(String(horario.data).slice(0, 10))) });
});

async function alterarBloqueio(req, res, novoStatus) {
  const horario = await Horario.findByPk(validarId(req.params.id, "Horário"));
  if (!horario) throw new ErroDaAplicacao("Horário não encontrado.", 404);
  const reservaAtiva = await Reserva.findOne({
    where: { horarioId: horario.id, status: { [Op.in]: ["aguardando_pagamento", "confirmada"] } },
  });
  if (reservaAtiva) throw new ErroDaAplicacao("O horário possui uma reserva ativa e não pode ser alterado.", 409);

  await horario.update({ status: novoStatus });
  await registrarLog({
    adminId: req.admin.id,
    acao: novoStatus === "bloqueado" ? "horario_bloqueado" : "horario_liberado",
    entidade: "horario",
    entidadeId: horario.id,
    enderecoIp: req.ip,
  });
  res.json({
    mensagem: novoStatus === "bloqueado" ? "Horário bloqueado com sucesso." : "Horário liberado com sucesso.",
    horario,
  });
}

export const bloquear = executarAssincrono(async (req, res) => alterarBloqueio(req, res, "bloqueado"));
export const liberar = executarAssincrono(async (req, res) => alterarBloqueio(req, res, "disponivel"));
