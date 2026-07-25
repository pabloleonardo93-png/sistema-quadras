import { registrarLog } from "../../services/logService.js";
import { limitarTentativasDadosCliente } from "../../services/limiteClienteService.js";
import { CLIENTE_STATUS } from "../../shared/constants/statusAdministrativos.js";
import ErroDaAplicacao from "../../utils/ErroDaAplicacao.js";
import { validarEmail, validarTelefoneBrasil, validarTexto } from "../../utils/validacoes.js";
import * as repository from "./cliente.repository.js";

export function clientePublico(cliente) {
  if (!cliente) return null;
  return {
    id: cliente.id,
    nome: cliente.nome,
    telefone: cliente.telefone,
    email: cliente.email,
    emailVerificadoEm: cliente.emailVerificadoEm,
  };
}

export async function buscarClientePorEmailValidado({ email }) {
  const emailNormalizado = validarEmail(email);
  return repository.buscarAtivoPorEmail(emailNormalizado);
}

export async function criarOuAtualizarClienteValidado({
  nome,
  telefone,
  email,
  validadoEm,
  enderecoIp = null,
}) {
  const emailNormalizado = validarEmail(email);
  limitarTentativasDadosCliente({ email: emailNormalizado, telefone, enderecoIp });

  const dados = {
    nome: validarTexto(nome, "Nome", 120),
    telefone: validarTelefoneBrasil(telefone),
    email: emailNormalizado,
    emailVerificadoEm: validadoEm || new Date(),
  };

  const existente = await repository.buscarPorEmail(dados.email);
  if (existente) {
    if (existente.status !== CLIENTE_STATUS.ATIVO) {
      throw new ErroDaAplicacao("Cliente encontrado, mas esta inativo.", 409);
    }

    await repository.atualizar(existente, {
      nome: dados.nome,
      telefone: dados.telefone,
      emailVerificadoEm: dados.emailVerificadoEm,
    });
    return existente;
  }

  return repository.criar(dados);
}

export function criarPublico(dadosCliente) {
  return criarOuAtualizarClienteValidado(dadosCliente);
}

export function listar(filtros) {
  return repository.listar(filtros);
}

export async function buscarPorId(id) {
  const cliente = await repository.buscarPorId(id);
  if (!cliente) throw new ErroDaAplicacao("Cliente nao encontrado.", 404);
  return cliente;
}

export async function atualizar({ id, dados, adminId, enderecoIp }) {
  const cliente = await repository.buscarPorId(id);
  if (!cliente) throw new ErroDaAplicacao("Cliente nao encontrado.", 404);
  const duplicado = await repository.buscarDuplicadoPorEmail(dados.email, cliente.id);
  if (duplicado) throw new ErroDaAplicacao("Ja existe um cliente com esse e-mail.", 409);

  await repository.atualizar(cliente, dados);
  await registrarLog({
    adminId,
    acao: "cliente_atualizado",
    entidade: "cliente",
    entidadeId: cliente.id,
    enderecoIp,
  });
  return cliente;
}

export async function alterarStatus({ id, status, adminId, enderecoIp }) {
  const cliente = await repository.buscarPorId(id);
  if (!cliente) throw new ErroDaAplicacao("Cliente nao encontrado.", 404);
  await repository.atualizarStatus(cliente, status);
  await registrarLog({
    adminId,
    acao: "status_cliente_alterado",
    entidade: "cliente",
    entidadeId: cliente.id,
    enderecoIp,
    detalhes: { status: cliente.status },
  });
  return cliente;
}
