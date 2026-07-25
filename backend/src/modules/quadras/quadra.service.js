import { registrarLog } from "../../services/logService.js";
import ErroDaAplicacao from "../../utils/ErroDaAplicacao.js";
import * as repository from "./quadra.repository.js";

async function buscarModalidades(ids, transaction) {
  const modalidades = await repository.buscarModalidadesAtivasPorIds(ids, transaction);
  if (modalidades.length !== ids.length) {
    throw new ErroDaAplicacao("Uma ou mais modalidades são inválidas ou estão inativas.");
  }
  return modalidades;
}

export function listar() {
  return repository.listarAtivas();
}

export function listarAdmin() {
  return repository.listarTodas();
}

export async function buscarPorId(id) {
  const quadra = await repository.buscarAtivaPorId(id);
  if (!quadra) throw new ErroDaAplicacao("Quadra não encontrada.", 404);
  return quadra;
}

export function criar({ dados, modalidadesIds, adminId, enderecoIp }) {
  return repository.executarTransacao(async (transaction) => {
    const existente = await repository.buscarPorNome(dados.nome, transaction);
    if (existente) throw new ErroDaAplicacao("Já existe uma quadra com esse nome.", 409);
    const modalidades = await buscarModalidades(modalidadesIds, transaction);
    const criada = await repository.criar(dados, transaction);
    await repository.definirModalidades(criada, modalidades, transaction);
    await registrarLog({
      adminId,
      acao: "quadra_criada",
      entidade: "quadra",
      entidadeId: criada.id,
      enderecoIp,
      transaction,
    });
    return repository.buscarComModalidades(criada.id, transaction);
  });
}

export function atualizar({ id, dados, modalidadesIds, adminId, enderecoIp }) {
  return repository.executarTransacao(async (transaction) => {
    const existente = await repository.buscarPorId(id, transaction);
    if (!existente) throw new ErroDaAplicacao("Quadra não encontrada.", 404);
    const duplicada = await repository.buscarDuplicadaPorNome(dados.nome, existente.id, transaction);
    if (duplicada) throw new ErroDaAplicacao("Já existe uma quadra com esse nome.", 409);
    const modalidades = await buscarModalidades(modalidadesIds, transaction);
    await repository.atualizar(existente, dados, transaction);
    await repository.definirModalidades(existente, modalidades, transaction);
    await registrarLog({
      adminId,
      acao: "quadra_atualizada",
      entidade: "quadra",
      entidadeId: existente.id,
      enderecoIp,
      transaction,
    });
    return repository.buscarComModalidades(existente.id, transaction);
  });
}

export async function alterarStatus({ id, status, adminId, enderecoIp }) {
  const quadra = await repository.buscarPorId(id);
  if (!quadra) throw new ErroDaAplicacao("Quadra não encontrada.", 404);
  await repository.atualizarStatus(quadra, status);
  await registrarLog({
    adminId,
    acao: "status_quadra_alterado",
    entidade: "quadra",
    entidadeId: quadra.id,
    enderecoIp,
    detalhes: { status: quadra.status },
  });
  return quadra;
}
