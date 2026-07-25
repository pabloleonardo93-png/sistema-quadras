import Admin from "../../models/Admin.js";
import LogSistema from "../../models/LogSistema.js";

const incluirAdministrador = [{ model: Admin, as: "administrador", attributes: ["id", "nome", "email"] }];

export function listar({ limite, offset }) {
  return LogSistema.findAndCountAll({
    include: incluirAdministrador,
    order: [["criadoEm", "DESC"]],
    limit: limite,
    offset,
  });
}

export function buscarPorId(id) {
  return LogSistema.findByPk(id, {
    include: incluirAdministrador,
  });
}
