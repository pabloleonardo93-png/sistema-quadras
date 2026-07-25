import Arquivo from "../../models/Arquivo.js";

export function criar(dados) {
  return Arquivo.create(dados);
}

export function listar() {
  return Arquivo.findAll({ order: [["criadoEm", "DESC"]] });
}

export function buscarPorId(id) {
  return Arquivo.findByPk(id);
}

export async function remover(arquivo) {
  await arquivo.destroy();
}
