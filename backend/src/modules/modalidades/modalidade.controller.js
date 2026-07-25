import executarAssincrono from "../../utils/executarAssincrono.js";
import * as service from "./modalidade.service.js";

export const listar = executarAssincrono(async (_req, res) => {
  const modalidades = await service.listar();
  res.json({ modalidades });
});

export const buscarPorId = executarAssincrono(async (req, res) => {
  const modalidade = await service.buscarPorId(req.dadosValidados.modalidade.id);
  res.json({ modalidade });
});

export const criar = executarAssincrono(async (req, res) => {
  const modalidade = await service.criar({
    ...req.dadosValidados.modalidade,
    adminId: req.admin.id,
    enderecoIp: req.ip,
  });
  res.status(201).json({ mensagem: "Modalidade cadastrada com sucesso.", modalidade });
});

export const atualizar = executarAssincrono(async (req, res) => {
  const modalidade = await service.atualizar({
    ...req.dadosValidados.modalidade,
    adminId: req.admin.id,
    enderecoIp: req.ip,
  });
  res.json({ mensagem: "Modalidade atualizada com sucesso.", modalidade });
});

export const alterarStatus = executarAssincrono(async (req, res) => {
  const modalidade = await service.alterarStatus({
    ...req.dadosValidados.modalidade,
    adminId: req.admin.id,
    enderecoIp: req.ip,
  });
  res.json({ mensagem: "Status da modalidade atualizado.", modalidade });
});
