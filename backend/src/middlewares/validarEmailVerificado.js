import { validarTokenTemporarioEmail } from "../services/verificacaoEmailService.js";
import ErroDaAplicacao from "../utils/ErroDaAplicacao.js";
import { extrairTokenVerificacaoEmail } from "../utils/emailVerificationToken.js";
import executarAssincrono from "../utils/executarAssincrono.js";

export const validarEmailVerificado = executarAssincrono(async (req, _res, next) => {
  const token = extrairTokenVerificacaoEmail(req);
  if (!token) {
    throw new ErroDaAplicacao("Valide o e-mail antes de continuar.", 401);
  }

  req.emailVerificado = await validarTokenTemporarioEmail({ token });
  next();
});
