import executarAssincrono from "../../utils/executarAssincrono.js";
import * as service from "./relatorio.service.js";

export const registrarAcesso = executarAssincrono(async (req, res) => {
  await service.registrarAcesso(req.dadosValidados.relatorio);
  res.status(201).json({ mensagem: "Acesso registrado." });
});

export const dashboard = executarAssincrono(async (_req, res) => {
  res.json(await service.obterDashboard());
});

export const reservas = executarAssincrono(async (req, res) => {
  res.json(await service.obterReservas(req.dadosValidados.relatorio));
});

export const ocupacao = executarAssincrono(async (_req, res) => {
  res.json(await service.obterOcupacao());
});

export const modalidades = executarAssincrono(async (_req, res) => {
  res.json(await service.obterModalidades());
});

export const acessos = executarAssincrono(async (req, res) => {
  res.json(await service.obterAcessos(req.dadosValidados.relatorio));
});
