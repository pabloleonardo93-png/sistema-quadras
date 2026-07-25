import { randomUUID } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import multer from "multer";
import ErroDaAplicacao from "../utils/ErroDaAplicacao.js";

const extensoesPorTipo = new Map([
  ["image/jpeg", new Set([".jpg", ".jpeg"])],
  ["image/png", new Set([".png"])],
  ["image/webp", new Set([".webp"])],
  ["application/pdf", new Set([".pdf"])],
]);

const extensaoArmazenada = new Map([
  ["image/jpeg", ".jpg"],
  ["image/png", ".png"],
  ["image/webp", ".webp"],
  ["application/pdf", ".pdf"],
]);

export const diretorioUploads = path.resolve(process.cwd(), process.env.UPLOAD_DIR || "uploads");
fs.mkdirSync(diretorioUploads, { recursive: true });

const armazenamento = multer.diskStorage({
  destination: (_req, _arquivo, callback) => callback(null, diretorioUploads),
  filename: (_req, arquivo, callback) => {
    callback(null, randomUUID() + extensaoArmazenada.get(arquivo.mimetype));
  },
});

export const upload = multer({
  storage: armazenamento,
  limits: { fileSize: Number(process.env.UPLOAD_MAX_SIZE || 5 * 1024 * 1024), files: 1 },
  fileFilter: (_req, arquivo, callback) => {
    const extensaoOriginal = path.extname(arquivo.originalname).toLowerCase();
    const extensoesPermitidas = extensoesPorTipo.get(arquivo.mimetype);
    if (!extensoesPermitidas?.has(extensaoOriginal)) {
      return callback(new ErroDaAplicacao("Tipo ou extensão de arquivo não permitido."));
    }
    callback(null, true);
  },
});

export async function validarConteudoArquivo(caminho, tipoMime) {
  const conteudo = await fs.promises.readFile(caminho);
  if (tipoMime === "image/jpeg") {
    return conteudo.length >= 3 && conteudo[0] === 0xff && conteudo[1] === 0xd8 && conteudo[2] === 0xff;
  }
  if (tipoMime === "image/png") {
    return conteudo.length >= 8
      && conteudo.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
  }
  if (tipoMime === "image/webp") {
    return conteudo.length >= 12
      && conteudo.subarray(0, 4).toString() === "RIFF"
      && conteudo.subarray(8, 12).toString() === "WEBP";
  }
  if (tipoMime === "application/pdf") {
    return conteudo.length >= 5 && conteudo.subarray(0, 5).toString() === "%PDF-";
  }
  return false;
}