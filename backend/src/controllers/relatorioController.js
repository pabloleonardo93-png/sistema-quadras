import { fn, col, Op, literal } from "sequelize";
import Cliente from "../models/Cliente.js";
import Horario from "../models/Horario.js";
import Modalidade from "../models/Modalidade.js";
import Quadra from "../models/Quadra.js";
import Reserva from "../models/Reserva.js";
import executarAssincrono from "../utils/executarAssincrono.js";
import { hojeLocal, validarData } from "../utils/validacoes.js";

function formatarData(data) {
  const ano = data.getFullYear();
  const mes = String(data.getMonth() + 1).padStart(2, "0");
  const dia = String(data.getDate()).padStart(2, "0");
  return ano + "-" + mes + "-" + dia;
}

export const dashboard = executarAssincrono(async (_req, res) => {
  const hoje = hojeLocal();
  const inicio = new Date();
  inicio.setDate(inicio.getDate() - inicio.getDay());
  const fim = new Date(inicio);
  fim.setDate(fim.getDate() + 6);

  const [
    reservasHoje,
    reservasSemana,
    clientesCadastrados,
    quadrasAtivas,
    reservasConfirmadas,
    reservasCanceladas,
    horariosMaisProcurados,
  ] = await Promise.all([
    Reserva.count({ where: { data: hoje } }),
    Reserva.count({ where: { data: { [Op.between]: [formatarData(inicio), formatarData(fim)] } } }),
    Cliente.count(),
    Quadra.count({ where: { status: "ativa" } }),
    Reserva.count({ where: { status: "confirmada" } }),
    Reserva.count({ where: { status: "cancelada" } }),
    Reserva.findAll({
      attributes: ["horaInicio", [fn("COUNT", col("id")), "total"]],
      group: ["horaInicio"],
      order: [[literal("total"), "DESC"]],
      limit: 5,
      raw: true,
    }),
  ]);

  res.json({
    reservasHoje,
    reservasSemana,
    clientesCadastrados,
    quadrasAtivas,
    reservasConfirmadas,
    reservasCanceladas,
    horariosMaisProcurados,
  });
});

export const reservas = executarAssincrono(async (req, res) => {
  const where = {};
  if (req.query.inicio && req.query.fim) {
    where.data = { [Op.between]: [validarData(req.query.inicio), validarData(req.query.fim)] };
  }
  const agrupadasPorStatus = await Reserva.findAll({
    where,
    attributes: ["status", [fn("COUNT", col("id")), "total"]],
    group: ["status"],
    order: [["status", "ASC"]],
    raw: true,
  });
  const total = await Reserva.count({ where });
  res.json({ total, agrupadasPorStatus });
});

export const ocupacao = executarAssincrono(async (_req, res) => {
  const [totalHorarios, horariosReservados, quadras] = await Promise.all([
    Horario.count(),
    Horario.count({ where: { status: "reservado" } }),
    Quadra.findAll({
      attributes: [
        "id",
        "nome",
        [fn("COUNT", col("horarios.id")), "totalHorarios"],
        [literal("COUNT(CASE WHEN horarios.status = 'reservado' THEN 1 END)"), "horariosReservados"],
      ],
      include: [{ model: Horario, as: "horarios", attributes: [], required: false }],
      group: ["Quadra.id"],
      order: [["nome", "ASC"]],
      raw: true,
    }),
  ]);
  const taxaOcupacao = totalHorarios === 0 ? 0 : Number(((horariosReservados / totalHorarios) * 100).toFixed(2));
  res.json({ totalHorarios, horariosReservados, taxaOcupacao, quadras });
});

export const modalidades = executarAssincrono(async (_req, res) => {
  const dados = await Modalidade.findAll({
    attributes: ["id", "nome", [fn("COUNT", col("reservas.id")), "totalReservas"]],
    include: [{ model: Reserva, as: "reservas", attributes: [], required: false }],
    group: ["Modalidade.id"],
    order: [[literal("\"totalReservas\""), "DESC"]],
    raw: true,
  });
  res.json({ modalidades: dados });
});
