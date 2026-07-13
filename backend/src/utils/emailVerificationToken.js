import { emailVerificacaoCookieNome } from "../config/verificacaoEmail.js";
import { obterCookie } from "./cookies.js";

export function extrairTokenVerificacaoEmail(req) {
  const authorization = req.headers.authorization || "";
  if (authorization.startsWith("Bearer ")) {
    return authorization.slice(7).trim();
  }

  return (
    req.headers["x-email-verification-token"] ||
    req.body?.emailVerificationToken ||
    req.body?.email_verification_token ||
    obterCookie(req, emailVerificacaoCookieNome) ||
    ""
  );
}
