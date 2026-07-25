import {
  emailVerificacaoCookieMaxAgeMs,
  emailVerificacaoCookieNome,
} from "../../config/verificacaoEmail.js";
import { extrairTokenVerificacaoEmail } from "../../utils/emailVerificationToken.js";
import executarAssincrono from "../../utils/executarAssincrono.js";
import * as service from "./verificacaoEmail.service.js";

function usarCookieSeguro(req) {
  const preferencia = process.env.EMAIL_VERIFICATION_COOKIE_SECURE;
  if (preferencia === "true") return true;
  if (preferencia === "false") return false;

  return (
    process.env.NODE_ENV === "production" ||
    req.secure ||
    req.headers["x-forwarded-proto"] === "https"
  );
}

function opcoesCookieVerificacao(req) {
  return {
    httpOnly: true,
    sameSite: "lax",
    secure: usarCookieSeguro(req),
    maxAge: emailVerificacaoCookieMaxAgeMs,
    path: "/",
  };
}

export const solicitarCodigo = executarAssincrono(async (req, res) => {
  const resultado = await service.solicitarCodigoEmail(req.dadosValidados.verificacaoEmail);

  res.status(201).json({
    mensagem: "Codigo enviado para o e-mail informado.",
    ...resultado,
  });
});

export const confirmarCodigo = executarAssincrono(async (req, res) => {
  const resultado = await service.confirmarCodigoEmail(req.dadosValidados.verificacaoEmail);

  res.cookie(emailVerificacaoCookieNome, resultado.token, opcoesCookieVerificacao(req));

  res.json({
    mensagem: "E-mail validado com sucesso.",
    ...resultado,
  });
});

export const obterSessao = executarAssincrono(async (req, res) => {
  const token = extrairTokenVerificacaoEmail(req);
  if (!token) {
    return res.json({ verificado: false });
  }

  try {
    const sessao = await service.validarTokenTemporarioEmail({ token });
    return res.json({
      verificado: true,
      email: sessao.email,
      validadoEm: sessao.validadoEm,
      tokenExpiraEm: sessao.tokenExpiraEm,
    });
  } catch {
    res.clearCookie(emailVerificacaoCookieNome, { path: "/" });
    return res.json({ verificado: false });
  }
});
