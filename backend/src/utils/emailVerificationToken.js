import { emailVerificacaoCookieNome } from "../config/verificacaoEmail.js";
import { obterCookie } from "./cookies.js";

export function extrairTokenVerificacaoEmail(req) {
  return obterCookie(req, emailVerificacaoCookieNome) || "";
}
