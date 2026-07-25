import Comunicado from "../../models/Comunicado.js";

export function criar(dados) {
  return Comunicado.create(dados);
}

export function listar(where) {
  return Comunicado.findAll({ where, order: [["criadoEm", "DESC"]] });
}

export function listarPublicos(statusPublicado) {
  return Comunicado.findAll({
    where: { status: statusPublicado },
    order: [["destaque", "DESC"], ["publicadoEm", "DESC"]],
  });
}

export function buscarPorId(id) {
  return Comunicado.findByPk(id);
}

export async function atualizar(comunicado, dados) {
  await comunicado.update(dados);
  return comunicado;
}
