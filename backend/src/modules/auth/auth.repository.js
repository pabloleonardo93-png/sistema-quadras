import Admin from "../../models/Admin.js";

export function buscarPorEmailComSenha(email) {
  return Admin.scope("comSenha").findOne({ where: { email } });
}

export function buscarPorId(id) {
  return Admin.findByPk(id);
}
