import executarAssincrono from "../../utils/executarAssincrono.js";
import * as service from "./comunicado.service.js";

export const criar = executarAssincrono(async (req, res) => {
  const comunicado = await service.criar({
    dados: req.dadosValidados.comunicado.dados,
    adminId: req.admin.id,
    enderecoIp: req.ip,
  });
  res.status(201).json({ mensagem: "Comunicado criado com sucesso.", comunicado });
});

export const listar = executarAssincrono(async (req, res) => {
  const comunicados = await service.listar({ status: req.dadosValidados?.comunicado?.status });
  res.json({ comunicados });
});

export const listarPublicos = executarAssincrono(async (_req, res) => {
  const comunicados = await service.listarPublicos();
  res.json({ comunicados });
});

export const buscarPorId = executarAssincrono(async (req, res) => {
  const comunicado = await service.buscarPorId(req.dadosValidados.comunicado.id);
  res.json({ comunicado });
});

export const atualizar = executarAssincrono(async (req, res) => {
  const comunicado = await service.atualizar({
    id: req.dadosValidados.comunicado.id,
    dados: req.dadosValidados.comunicado.dados,
    adminId: req.admin.id,
    enderecoIp: req.ip,
  });
  res.json({ mensagem: "Comunicado atualizado com sucesso.", comunicado });
});

export const publicar = executarAssincrono(async (req, res) => {
  const comunicado = await service.publicar({
    id: req.dadosValidados.comunicado.id,
    adminId: req.admin.id,
    enderecoIp: req.ip,
  });
  res.json({ mensagem: "Comunicado publicado com sucesso.", comunicado });
});

export const arquivar = executarAssincrono(async (req, res) => {
  const comunicado = await service.arquivar({
    id: req.dadosValidados.comunicado.id,
    adminId: req.admin.id,
    enderecoIp: req.ip,
  });
  res.json({ mensagem: "Comunicado arquivado com sucesso.", comunicado });
});
