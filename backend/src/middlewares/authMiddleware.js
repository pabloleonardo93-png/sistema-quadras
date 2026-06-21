import jwt from "jsonwebtoken";
import Admin from "../models/Admin.js";
import ErroDaAplicacao from "../utils/ErroDaAplicacao.js";
import executarAssincrono from "../utils/executarAssincrono.js";

export const autenticarAdministrador = executarAssincrono(async (req, _res, next) => {
  const cabecalho = req.headers.authorization;
  if (!cabecalho?.startsWith("Bearer ")) {
    throw new ErroDaAplicacao("Token de autenticação não informado.", 401);
  }

  const token = cabecalho.slice(7).trim();
  const dados = jwt.verify(token, process.env.JWT_SECRET);
  const administrador = await Admin.findByPk(Number(dados.sub));

  if (!administrador || administrador.status !== "ativo") {
    throw new ErroDaAplicacao("Administrador não autorizado.", 401);
  }

  req.admin = administrador;
  next();
});
