import Admin from "../models/Admin.js";
import LogSistema from "../models/LogSistema.js";
import ErroDaAplicacao from "../utils/ErroDaAplicacao.js";
import executarAssincrono from "../utils/executarAssincrono.js";
import { validarId } from "../utils/validacoes.js";

export const listar = executarAssincrono(async (req, res) => {
  const limite = Math.min(Math.max(Number(req.query.limite) || 50, 1), 100);
  const pagina = Math.max(Number(req.query.pagina) || 1, 1);
  const { rows: logs, count: total } = await LogSistema.findAndCountAll({
    include: [{ model: Admin, as: "administrador", attributes: ["id", "nome", "email"] }],
    order: [["criadoEm", "DESC"]],
    limit: limite,
    offset: (pagina - 1) * limite,
  });
  res.json({ pagina, limite, total, logs });
});

export const buscarPorId = executarAssincrono(async (req, res) => {
  const log = await LogSistema.findByPk(validarId(req.params.id, "Log"), {
    include: [{ model: Admin, as: "administrador", attributes: ["id", "nome", "email"] }],
  });
  if (!log) throw new ErroDaAplicacao("Log não encontrado.", 404);
  res.json({ log });
});
