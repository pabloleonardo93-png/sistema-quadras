import { Op } from "sequelize";
import sequelize from "../config/database.js";
import Modalidade from "../models/Modalidade.js";
import Quadra from "../models/Quadra.js";
import { registrarLog } from "../services/logService.js";
import ErroDaAplicacao from "../utils/ErroDaAplicacao.js";
import executarAssincrono from "../utils/executarAssincrono.js";
import { validarId, validarStatus, validarTexto, validarValorPositivo } from "../utils/validacoes.js";

const incluirModalidades = [{ model: Modalidade, as: "modalidades", through: { attributes: [] } }];

async function buscarModalidades(ids, transaction) {
  if (!Array.isArray(ids) || ids.length === 0) {
    throw new ErroDaAplicacao("Informe ao menos uma modalidade para a quadra.");
  }
  const identificadores = [...new Set(ids.map((id) => validarId(id, "Modalidade")))];
  const modalidades = await Modalidade.findAll({
    where: { id: identificadores, status: "ativa" },
    transaction,
  });
  if (modalidades.length !== identificadores.length) {
    throw new ErroDaAplicacao("Uma ou mais modalidades são inválidas ou estão inativas.");
  }
  return modalidades;
}

function dadosDaQuadra(corpo) {
  return {
    nome: validarTexto(corpo.nome, "Nome da quadra", 100),
    descricao: typeof corpo.descricao === "string" ? corpo.descricao.trim() || null : null,
    valorHora: validarValorPositivo(corpo.valorHora, "Valor por hora"),
    imagemUrl: typeof corpo.imagemUrl === "string" ? corpo.imagemUrl.trim() || null : null,
  };
}

export const listar = executarAssincrono(async (_req, res) => {
  const quadras = await Quadra.findAll({
    where: { status: "ativa" },
    include: incluirModalidades,
    order: [["nome", "ASC"]],
  });
  res.json({ quadras });
});

export const buscarPorId = executarAssincrono(async (req, res) => {
  const quadra = await Quadra.findOne({
    where: { id: validarId(req.params.id, "Quadra"), status: "ativa" },
    include: incluirModalidades,
  });
  if (!quadra) throw new ErroDaAplicacao("Quadra não encontrada.", 404);
  res.json({ quadra });
});

export const criar = executarAssincrono(async (req, res) => {
  const quadra = await sequelize.transaction(async (transaction) => {
    const dados = dadosDaQuadra(req.body);
    const existente = await Quadra.findOne({ where: { nome: dados.nome }, transaction });
    if (existente) throw new ErroDaAplicacao("Já existe uma quadra com esse nome.", 409);
    const modalidades = await buscarModalidades(req.body.modalidadesIds, transaction);
    const criada = await Quadra.create(dados, { transaction });
    await criada.setModalidades(modalidades, { transaction });
    await registrarLog({
      adminId: req.admin.id,
      acao: "quadra_criada",
      entidade: "quadra",
      entidadeId: criada.id,
      enderecoIp: req.ip,
      transaction,
    });
    return Quadra.findByPk(criada.id, { include: incluirModalidades, transaction });
  });
  res.status(201).json({ mensagem: "Quadra cadastrada com sucesso.", quadra });
});

export const atualizar = executarAssincrono(async (req, res) => {
  const quadra = await sequelize.transaction(async (transaction) => {
    const existente = await Quadra.findByPk(validarId(req.params.id, "Quadra"), { transaction });
    if (!existente) throw new ErroDaAplicacao("Quadra não encontrada.", 404);
    const dados = dadosDaQuadra(req.body);
    const duplicada = await Quadra.findOne({
      where: { nome: dados.nome, id: { [Op.ne]: existente.id } },
      transaction,
    });
    if (duplicada) throw new ErroDaAplicacao("Já existe uma quadra com esse nome.", 409);
    const modalidades = await buscarModalidades(req.body.modalidadesIds, transaction);
    await existente.update(dados, { transaction });
    await existente.setModalidades(modalidades, { transaction });
    await registrarLog({
      adminId: req.admin.id,
      acao: "quadra_atualizada",
      entidade: "quadra",
      entidadeId: existente.id,
      enderecoIp: req.ip,
      transaction,
    });
    return Quadra.findByPk(existente.id, { include: incluirModalidades, transaction });
  });
  res.json({ mensagem: "Quadra atualizada com sucesso.", quadra });
});

export const alterarStatus = executarAssincrono(async (req, res) => {
  const quadra = await Quadra.findByPk(validarId(req.params.id, "Quadra"));
  if (!quadra) throw new ErroDaAplicacao("Quadra não encontrada.", 404);
  await quadra.update({ status: validarStatus(req.body.status, ["ativa", "manutencao", "inativa"]) });
  await registrarLog({
    adminId: req.admin.id,
    acao: "status_quadra_alterado",
    entidade: "quadra",
    entidadeId: quadra.id,
    enderecoIp: req.ip,
    detalhes: { status: quadra.status },
  });
  res.json({ mensagem: "Status da quadra atualizado.", quadra });
});
