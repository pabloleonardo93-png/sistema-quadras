import executarAssincrono from "../../utils/executarAssincrono.js";
import * as service from "./arquivo.service.js";

export const enviar = executarAssincrono(async (req, res) => {
  const arquivo = await service.enviar({
    file: req.file,
    metadados: req.dadosValidados.arquivo,
    adminId: req.admin.id,
    enderecoIp: req.ip,
  });
  res.status(201).json({ mensagem: "Arquivo enviado com segurança.", arquivo });
});

export const listar = executarAssincrono(async (_req, res) => {
  const arquivos = await service.listar();
  res.json({ arquivos });
});

export const remover = executarAssincrono(async (req, res) => {
  await service.remover({
    id: req.dadosValidados.arquivo.id,
    adminId: req.admin.id,
    enderecoIp: req.ip,
  });
  res.json({ mensagem: "Arquivo removido com sucesso." });
});
