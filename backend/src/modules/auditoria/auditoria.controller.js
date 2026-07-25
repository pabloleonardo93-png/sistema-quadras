import executarAssincrono from "../../utils/executarAssincrono.js";
import * as service from "./auditoria.service.js";

export const listar = executarAssincrono(async (req, res) => {
  const resultado = await service.listar(req.dadosValidados.auditoria);
  res.json(resultado);
});

export const buscarPorId = executarAssincrono(async (req, res) => {
  const log = await service.buscarPorId(req.dadosValidados.auditoria.id);
  res.json({ log });
});
