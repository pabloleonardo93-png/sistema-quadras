import Cliente from "../models/Cliente.js";
import ErroDaAplicacao from "../utils/ErroDaAplicacao.js";
import { validarEmail, validarTelefoneBrasil, validarTexto } from "../utils/validacoes.js";
import { limitarTentativasDadosCliente } from "./limiteClienteService.js";

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
  const cliente = await Cliente.findOne({
    where: { email: emailNormalizado, status: "ativo" },
  });
  return cliente;
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

  const existente = await Cliente.findOne({ where: { email: dados.email } });
  if (existente) {
    if (existente.status !== "ativo") {
      throw new ErroDaAplicacao("Cliente encontrado, mas esta inativo.", 409);
    }

    await existente.update({
      nome: dados.nome,
      telefone: dados.telefone,
      emailVerificadoEm: dados.emailVerificadoEm,
    });
    return existente;
  }

  return Cliente.create(dados);
}
