import jwt from "jsonwebtoken";
import { buscarPorId } from "../modules/auth/auth.repository.js";
import { ADMIN_STATUS } from "../shared/constants/statusAdministrativos.js";
import ErroDaAplicacao from "../utils/ErroDaAplicacao.js";
import executarAssincrono from "../utils/executarAssincrono.js";

export const autenticarAdministrador = executarAssincrono(async (req, _res, next) => {
  const cabecalho = req.headers.authorization;
  if (!cabecalho?.startsWith("Bearer ")) {
    throw new ErroDaAplicacao("Token de autenticação não informado.", 401);
  }

  const token = cabecalho.slice(7).trim();
  const dados = jwt.verify(token, process.env.JWT_SECRET);
  const administrador = await buscarPorId(Number(dados.sub));

  if (!administrador || administrador.status !== ADMIN_STATUS.ATIVO) {
    throw new ErroDaAplicacao("Administrador não autorizado.", 401);
  }

  req.admin = administrador;
  next();
});
