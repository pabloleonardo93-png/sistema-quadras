import Comunicado from "../models/Comunicado.js";
import { registrarLog } from "../services/logService.js";
import ErroDaAplicacao from "../utils/ErroDaAplicacao.js";
import executarAssincrono from "../utils/executarAssincrono.js";
import { validarId, validarStatus, validarTexto } from "../utils/validacoes.js";

function dadosDoComunicado(corpo) {
  return {
    titulo: validarTexto(corpo.titulo, "Título", 180),
    mensagem: validarTexto(corpo.mensagem, "Mensagem", 10000),
    destaque: Boolean(corpo.destaque),
  };
}

export const criar = executarAssincrono(async (req, res) => {
  const comunicado = await Comunicado.create(dadosDoComunicado(req.body));
  await registrarLog({
    adminId: req.admin.id,
    acao: "comunicado_criado",
    entidade: "comunicado",
    entidadeId: comunicado.id,
    enderecoIp: req.ip,
  });
  res.status(201).json({ mensagem: "Comunicado criado com sucesso.", comunicado });
});

export const listar = executarAssincrono(async (req, res) => {
  const where = {};
  if (req.query.status) {
    where.status = validarStatus(req.query.status, ["rascunho", "publicado", "arquivado"]);
  }
  const comunicados = await Comunicado.findAll({ where, order: [["criadoEm", "DESC"]] });
  res.json({ comunicados });
});

export const listarPublicos = executarAssincrono(async (_req, res) => {
  const comunicados = await Comunicado.findAll({
    where: { status: "publicado" },
    order: [["destaque", "DESC"], ["publicadoEm", "DESC"]],
  });
  res.json({ comunicados });
});

export const buscarPorId = executarAssincrono(async (req, res) => {
  const comunicado = await Comunicado.findByPk(validarId(req.params.id, "Comunicado"));
  if (!comunicado) throw new ErroDaAplicacao("Comunicado não encontrado.", 404);
  res.json({ comunicado });
});

export const atualizar = executarAssincrono(async (req, res) => {
  const comunicado = await Comunicado.findByPk(validarId(req.params.id, "Comunicado"));
  if (!comunicado) throw new ErroDaAplicacao("Comunicado não encontrado.", 404);
  await comunicado.update(dadosDoComunicado(req.body));
  await registrarLog({
    adminId: req.admin.id,
    acao: "comunicado_atualizado",
    entidade: "comunicado",
    entidadeId: comunicado.id,
    enderecoIp: req.ip,
  });
  res.json({ mensagem: "Comunicado atualizado com sucesso.", comunicado });
});

async function alterarPublicacao(req, res, status) {
  const comunicado = await Comunicado.findByPk(validarId(req.params.id, "Comunicado"));
  if (!comunicado) throw new ErroDaAplicacao("Comunicado não encontrado.", 404);
  await comunicado.update({
    status,
    publicadoEm: status === "publicado" ? new Date() : comunicado.publicadoEm,
  });
  await registrarLog({
    adminId: req.admin.id,
    acao: "comunicado_" + status,
    entidade: "comunicado",
    entidadeId: comunicado.id,
    enderecoIp: req.ip,
  });
  res.json({
    mensagem: status === "publicado" ? "Comunicado publicado com sucesso." : "Comunicado arquivado com sucesso.",
    comunicado,
  });
}

export const publicar = executarAssincrono(async (req, res) => alterarPublicacao(req, res, "publicado"));
export const arquivar = executarAssincrono(async (req, res) => alterarPublicacao(req, res, "arquivado"));
