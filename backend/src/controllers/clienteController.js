import { Op } from "sequelize";
import Cliente from "../models/Cliente.js";
import { registrarLog } from "../services/logService.js";
import ErroDaAplicacao from "../utils/ErroDaAplicacao.js";
import executarAssincrono from "../utils/executarAssincrono.js";
import { validarEmail, validarId, validarStatus, validarTexto } from "../utils/validacoes.js";

function dadosDoCliente(corpo) {
  return {
    nome: validarTexto(corpo.nome, "Nome", 120),
    telefone: validarTexto(corpo.telefone, "Telefone", 30),
    email: validarEmail(corpo.email),
  };
}

export const criar = executarAssincrono(async (req, res) => {
  const dados = dadosDoCliente(req.body);
  const existente = await Cliente.findOne({ where: { email: dados.email } });
  if (existente) throw new ErroDaAplicacao("Já existe um cliente com esse e-mail.", 409);

  const cliente = await Cliente.create(dados);
  await registrarLog({
    acao: "cliente_criado",
    entidade: "cliente",
    entidadeId: cliente.id,
    enderecoIp: req.ip,
  });
  res.status(201).json({ mensagem: "Cliente cadastrado com sucesso.", cliente });
});

export const listar = executarAssincrono(async (req, res) => {
  const where = {};
  if (req.query.status) where.status = validarStatus(req.query.status, ["ativo", "inativo"]);
  if (req.query.busca) {
    where[Op.or] = [
      { nome: { [Op.iLike]: "%" + req.query.busca.trim() + "%" } },
      { email: { [Op.iLike]: "%" + req.query.busca.trim() + "%" } },
    ];
  }
  const clientes = await Cliente.findAll({ where, order: [["nome", "ASC"]] });
  res.json({ clientes });
});

export const buscarPorId = executarAssincrono(async (req, res) => {
  const cliente = await Cliente.findByPk(validarId(req.params.id, "Cliente"));
  if (!cliente) throw new ErroDaAplicacao("Cliente não encontrado.", 404);
  res.json({ cliente });
});

export const atualizar = executarAssincrono(async (req, res) => {
  const cliente = await Cliente.findByPk(validarId(req.params.id, "Cliente"));
  if (!cliente) throw new ErroDaAplicacao("Cliente não encontrado.", 404);
  const dados = dadosDoCliente(req.body);
  const duplicado = await Cliente.findOne({ where: { email: dados.email, id: { [Op.ne]: cliente.id } } });
  if (duplicado) throw new ErroDaAplicacao("Já existe um cliente com esse e-mail.", 409);

  await cliente.update(dados);
  await registrarLog({
    adminId: req.admin.id,
    acao: "cliente_atualizado",
    entidade: "cliente",
    entidadeId: cliente.id,
    enderecoIp: req.ip,
  });
  res.json({ mensagem: "Cliente atualizado com sucesso.", cliente });
});

export const alterarStatus = executarAssincrono(async (req, res) => {
  const cliente = await Cliente.findByPk(validarId(req.params.id, "Cliente"));
  if (!cliente) throw new ErroDaAplicacao("Cliente não encontrado.", 404);
  await cliente.update({ status: validarStatus(req.body.status, ["ativo", "inativo"]) });
  await registrarLog({
    adminId: req.admin.id,
    acao: "status_cliente_alterado",
    entidade: "cliente",
    entidadeId: cliente.id,
    enderecoIp: req.ip,
    detalhes: { status: cliente.status },
  });
  res.json({ mensagem: "Status do cliente atualizado.", cliente });
});
