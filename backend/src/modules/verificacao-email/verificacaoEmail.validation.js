import ErroDaAplicacao from "../../utils/ErroDaAplicacao.js";
import { validarEmail } from "../../utils/validacoes.js";

export function validarCodigoVerificacao(codigo) {
  if (typeof codigo !== "string" || !/^\d{6}$/.test(codigo.trim())) {
    throw new ErroDaAplicacao("Informe o codigo de 6 digitos.");
  }
  return codigo.trim();
}

export function validarSolicitacaoCodigo(req, _res, next) {
  req.dadosValidados = {
    ...req.dadosValidados,
    verificacaoEmail: {
      email: validarEmail(req.body.email),
      enderecoIp: req.ip,
      userAgent: req.headers["user-agent"],
    },
  };
  next();
}

export function validarConfirmacaoCodigo(req, _res, next) {
  req.dadosValidados = {
    ...req.dadosValidados,
    verificacaoEmail: {
      email: validarEmail(req.body.email),
      codigo: validarCodigoVerificacao(req.body.codigo || req.body.code),
    },
  };
  next();
}
