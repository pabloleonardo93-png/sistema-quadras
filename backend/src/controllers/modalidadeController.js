import { Op } from "sequelize";
import Modalidade from "../models/Modalidade.js";
import { registrarLog } from "../services/logService.js";
import ErroDaAplicacao from "../utils/ErroDaAplicacao.js";
import executarAssincrono from "../utils/executarAssincrono.js";
import { validarId, validarStatus, validarTexto } from "../utils/validacoes.js";

function dadosDaModalidade(corpo) {
  return {
    nome: validarTexto(corpo.nome, "Nome da modalidade", 100),
    descricao: typeof corpo.descricao === "string" ? corpo.descricao.trim() || null : null,
  };
}

export const listar = executarAssincrono(async (_req, res) => {
  const modalidades = await Modalidade.findAll({ where: { status: "ativa" }, order: [["nome", "ASC"]] });
  res.json({ modalidades });
});

export const buscarPorId = executarAssincrono(async (req, res) => {
  const modalidade = await Modalidade.findOne({
    where: { id: validarId(req.params.id, "Modalidade"), status: "ativa" },
  });
  if (!modalidade) throw new ErroDaAplicacao("Modalidade não encontrada.", 404);
  res.json({ modalidade });
});

export const criar = executarAssincrono(async (req, res) => {
  const dados = dadosDaModalidade(req.body);
  if (await Modalidade.findOne({ where: { nome: dados.nome } })) {
    throw new ErroDaAplicacao("Já existe uma modalidade com esse nome.", 409);
  }
  const modalidade = await Modalidade.create(dados);
  await registrarLog({
    adminId: req.admin.id,
    acao: "modalidade_criada",
    entidade: "modalidade",
    entidadeId: modalidade.id,
    enderecoIp: req.ip,
  });
  res.status(201).json({ mensagem: "Modalidade cadastrada com sucesso.", modalidade });
});

export const atualizar = executarAssincrono(async (req, res) => {
  const modalidade = await Modalidade.findByPk(validarId(req.params.id, "Modalidade"));
  if (!modalidade) throw new ErroDaAplicacao("Modalidade não encontrada.", 404);
  const dados = dadosDaModalidade(req.body);
  if (await Modalidade.findOne({ where: { nome: dados.nome, id: { [Op.ne]: modalidade.id } } })) {
    throw new ErroDaAplicacao("Já existe uma modalidade com esse nome.", 409);
  }
  await modalidade.update(dados);
  await registrarLog({
    adminId: req.admin.id,
    acao: "modalidade_atualizada",
    entidade: "modalidade",
    entidadeId: modalidade.id,
    enderecoIp: req.ip,
  });
  res.json({ mensagem: "Modalidade atualizada com sucesso.", modalidade });
});

export const alterarStatus = executarAssincrono(async (req, res) => {
  const modalidade = await Modalidade.findByPk(validarId(req.params.id, "Modalidade"));
  if (!modalidade) throw new ErroDaAplicacao("Modalidade não encontrada.", 404);
  await modalidade.update({ status: validarStatus(req.body.status, ["ativa", "inativa"]) });
  await registrarLog({
    adminId: req.admin.id,
    acao: "status_modalidade_alterado",
    entidade: "modalidade",
    entidadeId: modalidade.id,
    enderecoIp: req.ip,
    detalhes: { status: modalidade.status },
  });
  res.json({ mensagem: "Status da modalidade atualizado.", modalidade });
});
