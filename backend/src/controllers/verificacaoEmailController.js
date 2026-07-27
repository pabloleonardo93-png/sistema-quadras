import { emailVerificacaoCookieNome } from "../config/verificacaoEmail.js";
import {
  confirmarCodigoEmail,
  revogarTokenTemporarioEmail,
  solicitarCodigoEmail,
  validarTokenTemporarioEmail,
} from "../services/verificacaoEmailService.js";
import { extrairTokenVerificacaoEmail } from "../utils/emailVerificationToken.js";
import { limparCookieVerificacao, opcoesCookieVerificacao } from "../utils/emailVerificationCookie.js";
import executarAssincrono from "../utils/executarAssincrono.js";

export const solicitarCodigo = executarAssincrono(async (req, res) => {
  const resultado = await solicitarCodigoEmail({
    email: req.body.email,
    enderecoIp: req.ip,
    userAgent: req.headers["user-agent"],
  });

  res.status(201).json({
    mensagem: "Codigo enviado para o e-mail informado.",
    ...resultado,
  });
});

export const confirmarCodigo = executarAssincrono(async (req, res) => {
  const resultado = await confirmarCodigoEmail({
    email: req.body.email,
    codigo: req.body.codigo || req.body.code,
    enderecoIp: req.ip,
  });

  res.cookie(emailVerificacaoCookieNome, resultado.token, opcoesCookieVerificacao(req));

  res.json({
    mensagem: "E-mail validado com sucesso.",
    email: resultado.email,
    validadoEm: resultado.validadoEm,
    tokenExpiraEm: resultado.tokenExpiraEm,
  });
});

export const obterSessao = executarAssincrono(async (req, res) => {
  const token = extrairTokenVerificacaoEmail(req);
  if (!token) {
    return res.set("Cache-Control", "no-store").set("Pragma", "no-cache").json({ verificado: false });
  }

  try {
    const sessao = await validarTokenTemporarioEmail({ token });
    return res.set("Cache-Control", "no-store").set("Pragma", "no-cache").json({
      verificado: true,
      email: sessao.email,
      validadoEm: sessao.validadoEm,
      tokenExpiraEm: sessao.tokenExpiraEm,
    });
  } catch {
    limparCookieVerificacao(res, req);
    return res.set("Cache-Control", "no-store").set("Pragma", "no-cache").json({ verificado: false });
  }
});

export const encerrarSessao = executarAssincrono(async (req, res) => {
  const token = extrairTokenVerificacaoEmail(req);
  if (token) {
    await revogarTokenTemporarioEmail({ token }).catch(() => {});
  }
  limparCookieVerificacao(res, req);
  res.status(204).end();
});
