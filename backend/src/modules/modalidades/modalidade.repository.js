import { Op } from "sequelize";
import Modalidade from "../../models/Modalidade.js";
import { MODALIDADE_STATUS } from "../../shared/constants/statusAdministrativos.js";

export function listarAtivas() {
  return Modalidade.findAll({ where: { status: MODALIDADE_STATUS.ATIVA }, order: [["nome", "ASC"]] });
}

export function buscarAtivaPorId(id) {
  return Modalidade.findOne({
    where: { id, status: MODALIDADE_STATUS.ATIVA },
  });
}

export function buscarPorId(id) {
  return Modalidade.findByPk(id);
}

export function buscarPorNome(nome) {
  return Modalidade.findOne({ where: { nome } });
}

export function buscarDuplicadaPorNome(nome, id) {
  return Modalidade.findOne({ where: { nome, id: { [Op.ne]: id } } });
}

export function criar(dados) {
  return Modalidade.create(dados);
}

export async function atualizar(modalidade, dados) {
  await modalidade.update(dados);
  return modalidade;
}

export async function atualizarStatus(modalidade, status) {
  await modalidade.update({ status });
  return modalidade;
}
