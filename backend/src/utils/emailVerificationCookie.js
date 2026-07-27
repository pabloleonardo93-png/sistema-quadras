import {
  emailVerificacaoCookieMaxAgeMs,
  emailVerificacaoCookieNome,
} from "../config/verificacaoEmail.js";

function usarCookieSeguro(req) {
  const preferencia = process.env.EMAIL_VERIFICATION_COOKIE_SECURE;
  if (preferencia === "true") return true;
  if (preferencia === "false") return false;
  return process.env.NODE_ENV === "production" || req.secure || req.headers["x-forwarded-proto"] === "https";
}

export function opcoesCookieVerificacao(req, { limpar = false } = {}) {
  return {
    httpOnly: true,
    sameSite: "lax",
    secure: usarCookieSeguro(req),
    path: "/",
    ...(limpar ? {} : { maxAge: emailVerificacaoCookieMaxAgeMs }),
  };
}

export function limparCookieVerificacao(res, req) {
  res.clearCookie(emailVerificacaoCookieNome, opcoesCookieVerificacao(req, { limpar: true }));
}
