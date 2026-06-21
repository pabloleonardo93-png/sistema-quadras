import LogSistema from "../models/LogSistema.js";

export async function registrarLog({
  adminId = null,
  acao,
  entidade = null,
  entidadeId = null,
  enderecoIp = null,
  detalhes = null,
  transaction,
}) {
  return LogSistema.create({
    adminId,
    acao,
    entidade,
    entidadeId,
    enderecoIp,
    detalhes,
  }, { transaction });
}
