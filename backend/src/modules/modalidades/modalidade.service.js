import { registrarLog } from "../../services/logService.js";
import ErroDaAplicacao from "../../utils/ErroDaAplicacao.js";
import * as repository from "./modalidade.repository.js";

export function listar() {
  return repository.listarAtivas();
}

export async function buscarPorId(id) {
  const modalidade = await repository.buscarAtivaPorId(id);
  if (!modalidade) throw new ErroDaAplicacao("Modalidade não encontrada.", 404);
  return modalidade;
}

export async function criar({ dados, adminId, enderecoIp }) {
  if (await repository.buscarPorNome(dados.nome)) {
    throw new ErroDaAplicacao("Já existe uma modalidade com esse nome.", 409);
  }
  const modalidade = await repository.criar(dados);
  await registrarLog({
    adminId,
    acao: "modalidade_criada",
    entidade: "modalidade",
    entidadeId: modalidade.id,
    enderecoIp,
  });
  return modalidade;
}

export async function atualizar({ id, dados, adminId, enderecoIp }) {
  const modalidade = await repository.buscarPorId(id);
  if (!modalidade) throw new ErroDaAplicacao("Modalidade não encontrada.", 404);
  if (await repository.buscarDuplicadaPorNome(dados.nome, modalidade.id)) {
    throw new ErroDaAplicacao("Já existe uma modalidade com esse nome.", 409);
  }
  await repository.atualizar(modalidade, dados);
  await registrarLog({
    adminId,
    acao: "modalidade_atualizada",
    entidade: "modalidade",
    entidadeId: modalidade.id,
    enderecoIp,
  });
  return modalidade;
}

export async function alterarStatus({ id, status, adminId, enderecoIp }) {
  const modalidade = await repository.buscarPorId(id);
  if (!modalidade) throw new ErroDaAplicacao("Modalidade não encontrada.", 404);
  await repository.atualizarStatus(modalidade, status);
  await registrarLog({
    adminId,
    acao: "status_modalidade_alterado",
    entidade: "modalidade",
    entidadeId: modalidade.id,
    enderecoIp,
    detalhes: { status: modalidade.status },
  });
  return modalidade;
}
