import executarAssincrono from "../../utils/executarAssincrono.js";
import * as service from "./quadra.service.js";

export const listar = executarAssincrono(async (_req, res) => {
  const quadras = await service.listar();
  res.json({ quadras });
});

export const listarAdmin = executarAssincrono(async (_req, res) => {
  const quadras = await service.listarAdmin();
  res.json({ quadras });
});

export const buscarPorId = executarAssincrono(async (req, res) => {
  const quadra = await service.buscarPorId(req.dadosValidados.quadra.id);
  res.json({ quadra });
});

export const criar = executarAssincrono(async (req, res) => {
  const quadra = await service.criar({
    ...req.dadosValidados.quadra,
    adminId: req.admin.id,
    enderecoIp: req.ip,
  });
  res.status(201).json({ mensagem: "Quadra cadastrada com sucesso.", quadra });
});

export const atualizar = executarAssincrono(async (req, res) => {
  const quadra = await service.atualizar({
    ...req.dadosValidados.quadra,
    adminId: req.admin.id,
    enderecoIp: req.ip,
  });
  res.json({ mensagem: "Quadra atualizada com sucesso.", quadra });
});

export const alterarStatus = executarAssincrono(async (req, res) => {
  const quadra = await service.alterarStatus({
    ...req.dadosValidados.quadra,
    adminId: req.admin.id,
    enderecoIp: req.ip,
  });
  res.json({ mensagem: "Status da quadra atualizado.", quadra });
});
