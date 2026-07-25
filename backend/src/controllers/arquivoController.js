import fs from "node:fs/promises";
import path from "node:path";
import { diretorioUploads, validarConteudoArquivo } from "../middlewares/uploadMiddleware.js";
import Arquivo from "../models/Arquivo.js";
import { registrarLog } from "../services/logService.js";
import ErroDaAplicacao from "../utils/ErroDaAplicacao.js";
import executarAssincrono from "../utils/executarAssincrono.js";
import { validarId, validarTexto } from "../utils/validacoes.js";

function comUrl(arquivo) {
  const dados = arquivo.toJSON();
  return { ...dados, url: "/uploads/" + dados.nomeArmazenado };
}

export const enviar = executarAssincrono(async (req, res) => {
  if (!req.file) throw new ErroDaAplicacao("Selecione um arquivo para enviar.");
  if (!await validarConteudoArquivo(req.file.path, req.file.mimetype)) {
    await fs.unlink(req.file.path).catch(() => {});
    throw new ErroDaAplicacao("O conteúdo do arquivo não corresponde ao tipo informado.");
  }

  try {
    const arquivo = await Arquivo.create({
      adminId: req.admin.id,
      nomeOriginal: req.file.originalname.slice(0, 255),
      nomeArmazenado: req.file.filename,
      tipoMime: req.file.mimetype,
      tamanho: req.file.size,
      caminho: req.file.filename,
      entidade: req.body.entidade ? validarTexto(req.body.entidade, "Entidade", 80) : null,
      entidadeId: req.body.entidadeId ? validarId(req.body.entidadeId, "Entidade") : null,
    });
    await registrarLog({
      adminId: req.admin.id,
      acao: "arquivo_enviado",
      entidade: "arquivo",
      entidadeId: arquivo.id,
      enderecoIp: req.ip,
      detalhes: { tipoMime: arquivo.tipoMime, tamanho: arquivo.tamanho },
    });
    res.status(201).json({ mensagem: "Arquivo enviado com segurança.", arquivo: comUrl(arquivo) });
  } catch (erro) {
    await fs.unlink(req.file.path).catch(() => {});
    throw erro;
  }
});

export const listar = executarAssincrono(async (_req, res) => {
  const arquivos = await Arquivo.findAll({ order: [["criadoEm", "DESC"]] });
  res.json({ arquivos: arquivos.map(comUrl) });
});

export const remover = executarAssincrono(async (req, res) => {
  const arquivo = await Arquivo.findByPk(validarId(req.params.id, "Arquivo"));
  if (!arquivo) throw new ErroDaAplicacao("Arquivo não encontrado.", 404);

  const caminhoAbsoluto = path.resolve(diretorioUploads, arquivo.nomeArmazenado);
  if (!caminhoAbsoluto.startsWith(diretorioUploads + path.sep)) {
    throw new ErroDaAplicacao("Caminho de arquivo inválido.", 400);
  }
  await fs.unlink(caminhoAbsoluto).catch((erro) => {
    if (erro.code !== "ENOENT") throw erro;
  });
  await arquivo.destroy();
  await registrarLog({
    adminId: req.admin.id,
    acao: "arquivo_removido",
    entidade: "arquivo",
    entidadeId: arquivo.id,
    enderecoIp: req.ip,
  });
  res.json({ mensagem: "Arquivo removido com sucesso." });
});
