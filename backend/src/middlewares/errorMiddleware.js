import multer from "multer";
import {
  ForeignKeyConstraintError,
  UniqueConstraintError,
  ValidationError,
} from "sequelize";
import ErroDaAplicacao from "../utils/ErroDaAplicacao.js";

export function rotaNaoEncontrada(req, _res, next) {
  next(new ErroDaAplicacao("Rota " + req.method + " " + req.originalUrl + " não encontrada.", 404));
}

export function tratarErro(erro, _req, res, _next) {
  if (erro instanceof ErroDaAplicacao) {
    return res.status(erro.status).json({ erro: erro.message });
  }
  if (erro instanceof multer.MulterError) {
    const mensagem = erro.code === "LIMIT_FILE_SIZE"
      ? "O arquivo ultrapassa o tamanho máximo permitido."
      : "Não foi possível processar o arquivo enviado.";
    return res.status(400).json({ erro: mensagem });
  }
  if (erro.name === "JsonWebTokenError" || erro.name === "TokenExpiredError") {
    return res.status(401).json({ erro: "Token inválido ou expirado." });
  }
  if (erro instanceof UniqueConstraintError) {
    return res.status(409).json({ erro: "Já existe um registro com esses dados." });
  }
  if (erro instanceof ForeignKeyConstraintError) {
    return res.status(409).json({ erro: "O registro está sendo utilizado e não pode ser removido." });
  }
  if (erro instanceof ValidationError) {
    return res.status(400).json({ erro: "Os dados informados são inválidos." });
  }
  if (erro instanceof SyntaxError && Object.hasOwn(erro, "body")) {
    return res.status(400).json({ erro: "O corpo JSON da requisição é inválido." });
  }

  console.error("Erro interno:", erro.message);
  return res.status(500).json({ erro: "Erro interno do servidor." });
}
