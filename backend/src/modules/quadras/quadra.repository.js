import { Op } from "sequelize";
import sequelize from "../../config/database.js";
import Modalidade from "../../models/Modalidade.js";
import Quadra from "../../models/Quadra.js";
import { MODALIDADE_STATUS, QUADRA_STATUS } from "../../shared/constants/statusAdministrativos.js";

const incluirModalidades = [{ model: Modalidade, as: "modalidades", through: { attributes: [] } }];

export function executarTransacao(callback) {
  return sequelize.transaction(callback);
}

export function listarAtivas() {
  return Quadra.findAll({
    where: { status: QUADRA_STATUS.ATIVA },
    include: incluirModalidades,
    order: [["nome", "ASC"]],
  });
}

export function listarTodas() {
  return Quadra.findAll({
    include: incluirModalidades,
    order: [["nome", "ASC"]],
  });
}

export function buscarAtivaPorId(id) {
  return Quadra.findOne({
    where: { id, status: QUADRA_STATUS.ATIVA },
    include: incluirModalidades,
  });
}

export function buscarPorId(id, transaction) {
  return Quadra.findByPk(id, { transaction });
}

export function buscarPorNome(nome, transaction) {
  return Quadra.findOne({ where: { nome }, transaction });
}

export function buscarDuplicadaPorNome(nome, id, transaction) {
  return Quadra.findOne({
    where: { nome, id: { [Op.ne]: id } },
    transaction,
  });
}

export function buscarModalidadesAtivasPorIds(ids, transaction) {
  return Modalidade.findAll({
    where: { id: ids, status: MODALIDADE_STATUS.ATIVA },
    transaction,
  });
}

export function criar(dados, transaction) {
  return Quadra.create(dados, { transaction });
}

export async function atualizar(quadra, dados, transaction) {
  await quadra.update(dados, { transaction });
}

export async function definirModalidades(quadra, modalidades, transaction) {
  await quadra.setModalidades(modalidades, { transaction });
}

export function buscarComModalidades(id, transaction) {
  return Quadra.findByPk(id, { include: incluirModalidades, transaction });
}

export async function atualizarStatus(quadra, status) {
  await quadra.update({ status });
  return quadra;
}
