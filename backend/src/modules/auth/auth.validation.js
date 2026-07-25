import { validarEmail, validarTexto } from "../../utils/validacoes.js";

export function validarLogin(req, _res, next) {
  req.dadosValidados = {
    ...req.dadosValidados,
    auth: {
      email: validarEmail(req.body.email),
      senha: validarTexto(req.body.senha, "Senha", 200),
    },
  };
  next();
}
