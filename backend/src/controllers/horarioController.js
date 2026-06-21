import { Op } from "sequelize";
import Horario from "../models/Horario.js";
import Quadra from "../models/Quadra.js";
import Reserva from "../models/Reserva.js";
import { registrarLog } from "../services/logService.js";
import ErroDaAplicacao from "../utils/ErroDaAplicacao.js";
import executarAssincrono from "../utils/executarAssincrono.js";
import { hojeLocal, validarData, validarHora, validarId, validarStatus } from "../utils/validacoes.js";

export const criar = executarAssincrono(async (req, res) => {
  const quadraId = validarId(req.body.quadraId, "Quadra");
  const quadra = await Quadra.findByPk(quadraId);
  if (!quadra || quadra.status !== "ativa") {
    throw new ErroDaAplicacao("Quadra não encontrada ou indisponível.", 409);
  }
  const data = validarData(req.body.data);
  if (data < hojeLocal()) throw new ErroDaAplicacao("Não é possível criar um horário em uma data passada.");
  const horaInicio = validarHora(req.body.horaInicio, "Hora inicial");
  const horaFim = validarHora(req.body.horaFim, "Hora final");
  if (horaFim <= horaInicio) throw new ErroDaAplicacao("A hora final deve ser posterior à hora inicial.");

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
  if (req.query.quadraId) where.quadraId = validarId(req.query.quadraId, "Quadra");
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
  const where = { status: "disponivel" };
  if (req.query.quadraId) where.quadraId = validarId(req.query.quadraId, "Quadra");
  where.data = req.query.data ? validarData(req.query.data) : { [Op.gte]: hojeLocal() };
  const horarios = await Horario.findAll({
    where,
    include: [{ model: Quadra, as: "quadra", where: { status: "ativa" } }],
    order: [["data", "ASC"], ["horaInicio", "ASC"]],
  });
  res.json({ horarios });
});

async function alterarBloqueio(req, res, novoStatus) {
  const horario = await Horario.findByPk(validarId(req.params.id, "Horário"));
  if (!horario) throw new ErroDaAplicacao("Horário não encontrado.", 404);
  const reservaAtiva = await Reserva.findOne({
    where: { horarioId: horario.id, status: { [Op.in]: ["pendente", "confirmada"] } },
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
