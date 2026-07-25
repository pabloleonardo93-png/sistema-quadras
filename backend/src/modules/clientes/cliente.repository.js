import { Op } from "sequelize";
import Cliente from "../../models/Cliente.js";
import { CLIENTE_STATUS } from "../../shared/constants/statusAdministrativos.js";

export function buscarAtivoPorEmail(email) {
  return Cliente.findOne({
    where: { email, status: CLIENTE_STATUS.ATIVO },
  });
}

export function buscarPorEmail(email) {
  return Cliente.findOne({ where: { email } });
}

export function criar(dados) {
  return Cliente.create(dados);
}

export async function atualizar(cliente, dados) {
  await cliente.update(dados);
  return cliente;
}

export function listar({ status, busca }) {
  const where = {};
  if (status) where.status = status;
  if (busca) {
    where[Op.or] = [
      { nome: { [Op.iLike]: "%" + busca + "%" } },
      { email: { [Op.iLike]: "%" + busca + "%" } },
    ];
  }
  return Cliente.findAll({ where, order: [["nome", "ASC"]] });
}

export function buscarPorId(id) {
  return Cliente.findByPk(id);
}

export function buscarDuplicadoPorEmail(email, id) {
  return Cliente.findOne({ where: { email, id: { [Op.ne]: id } } });
}

export async function atualizarStatus(cliente, status) {
  await cliente.update({ status });
  return cliente;
}
