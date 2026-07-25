import { registrarLog } from "../../services/logService.js";
import { COMUNICADO_STATUS } from "../../shared/constants/statusAdministrativos.js";
import ErroDaAplicacao from "../../utils/ErroDaAplicacao.js";
import * as repository from "./comunicado.repository.js";

function registrarLogComunicado({ adminId, acao, comunicadoId, enderecoIp }) {
  return registrarLog({
    adminId,
    acao,
    entidade: "comunicado",
    entidadeId: comunicadoId,
    enderecoIp,
  });
}

export async function criar({ dados, adminId, enderecoIp }) {
  const comunicado = await repository.criar(dados);
  await registrarLogComunicado({
    adminId,
    acao: "comunicado_criado",
    comunicadoId: comunicado.id,
    enderecoIp,
  });
  return comunicado;
}

export function listar({ status }) {
  const where = {};
  if (status) where.status = status;
  return repository.listar(where);
}

export function listarPublicos() {
  return repository.listarPublicos(COMUNICADO_STATUS.PUBLICADO);
}

export async function buscarPorId(id) {
  const comunicado = await repository.buscarPorId(id);
  if (!comunicado) throw new ErroDaAplicacao("Comunicado nÃ£o encontrado.", 404);
  return comunicado;
}

export async function atualizar({ id, dados, adminId, enderecoIp }) {
  const comunicado = await buscarPorId(id);
  await repository.atualizar(comunicado, dados);
  await registrarLogComunicado({
    adminId,
    acao: "comunicado_atualizado",
    comunicadoId: comunicado.id,
    enderecoIp,
  });
  return comunicado;
}

async function alterarPublicacao({ id, status, adminId, enderecoIp }) {
  const comunicado = await buscarPorId(id);
  await repository.atualizar(comunicado, {
    status,
    publicadoEm: status === COMUNICADO_STATUS.PUBLICADO ? new Date() : comunicado.publicadoEm,
  });
  await registrarLogComunicado({
    adminId,
    acao: "comunicado_" + status,
    comunicadoId: comunicado.id,
    enderecoIp,
  });
  return comunicado;
}

export function publicar({ id, adminId, enderecoIp }) {
  return alterarPublicacao({ id, status: COMUNICADO_STATUS.PUBLICADO, adminId, enderecoIp });
}

export function arquivar({ id, adminId, enderecoIp }) {
  return alterarPublicacao({ id, status: COMUNICADO_STATUS.ARQUIVADO, adminId, enderecoIp });
}
