import fs from "node:fs/promises";
import path from "node:path";
import { registrarLog } from "../../services/logService.js";
import ErroDaAplicacao from "../../utils/ErroDaAplicacao.js";
import * as repository from "./arquivo.repository.js";
import { diretorioUploads, validarConteudoArquivo } from "./arquivo.upload.js";

function comUrl(arquivo) {
  const dados = arquivo.toJSON();
  return { ...dados, url: "/uploads/" + dados.nomeArmazenado };
}

async function removerArquivoFisico(caminho) {
  await fs.unlink(caminho).catch((erro) => {
    if (erro.code !== "ENOENT") throw erro;
  });
}

async function removerArquivoEnviado(caminho) {
  await fs.unlink(caminho).catch(() => {});
}

export async function enviar({ file, metadados, adminId, enderecoIp }) {
  if (!file) throw new ErroDaAplicacao("Selecione um arquivo para enviar.");
  if (!await validarConteudoArquivo(file.path, file.mimetype)) {
    await removerArquivoEnviado(file.path);
    throw new ErroDaAplicacao("O conteúdo do arquivo não corresponde ao tipo informado.");
  }

  try {
    const arquivo = await repository.criar({
      adminId,
      nomeOriginal: file.originalname.slice(0, 255),
      nomeArmazenado: file.filename,
      tipoMime: file.mimetype,
      tamanho: file.size,
      caminho: file.filename,
      entidade: metadados.entidade,
      entidadeId: metadados.entidadeId,
    });
    await registrarLog({
      adminId,
      acao: "arquivo_enviado",
      entidade: "arquivo",
      entidadeId: arquivo.id,
      enderecoIp,
      detalhes: { tipoMime: arquivo.tipoMime, tamanho: arquivo.tamanho },
    });
    return comUrl(arquivo);
  } catch (erro) {
    await removerArquivoEnviado(file.path);
    throw erro;
  }
}

export async function listar() {
  const arquivos = await repository.listar();
  return arquivos.map(comUrl);
}

export async function remover({ id, adminId, enderecoIp }) {
  const arquivo = await repository.buscarPorId(id);
  if (!arquivo) throw new ErroDaAplicacao("Arquivo não encontrado.", 404);

  const caminhoAbsoluto = path.resolve(diretorioUploads, arquivo.nomeArmazenado);
  if (!caminhoAbsoluto.startsWith(diretorioUploads + path.sep)) {
    throw new ErroDaAplicacao("Caminho de arquivo inválido.", 400);
  }

  await removerArquivoFisico(caminhoAbsoluto);
  await repository.remover(arquivo);
  await registrarLog({
    adminId,
    acao: "arquivo_removido",
    entidade: "arquivo",
    entidadeId: arquivo.id,
    enderecoIp,
  });
}
