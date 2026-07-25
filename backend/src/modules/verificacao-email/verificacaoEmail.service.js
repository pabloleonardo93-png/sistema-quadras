import crypto from "node:crypto";
import jwt from "jsonwebtoken";
import {
  calcularExpiracaoCodigoEmail,
  calcularExpiracaoTokenEmail,
  calcularInicioJanelaEnviosEmail,
  calcularLiberacaoReenvioEmail,
  codigoEmailValidadeMinutos,
  intervaloReenvioEmailSegundos,
  maxEnviosPorEmail,
  maxEnviosPorIp,
  maxTentativasCodigoEmail,
  provedorVerificacaoEmail,
  tokenEmailValidadeMinutos,
} from "../../config/verificacaoEmail.js";
import { enviarCodigoPorResend } from "../../services/resendService.js";
import { VERIFICACAO_EMAIL_STATUS } from "../../shared/constants/verificacaoEmailStatus.js";
import ErroDaAplicacao from "../../utils/ErroDaAplicacao.js";
import { validarEmail } from "../../utils/validacoes.js";
import * as repository from "./verificacaoEmail.repository.js";
import { validarCodigoVerificacao } from "./verificacaoEmail.validation.js";

function segredoVerificacao() {
  return process.env.EMAIL_VERIFICATION_SECRET || process.env.JWT_SECRET || "dev-email-verification-secret";
}

function segredoJwtEmail() {
  const segredo = process.env.EMAIL_VERIFICATION_JWT_SECRET || process.env.JWT_SECRET;
  if (!segredo) {
    throw new ErroDaAplicacao("JWT_SECRET nao foi configurada para validar e-mail.", 503);
  }
  return segredo;
}

export function criarHashVerificacao(valor) {
  return crypto
    .createHmac("sha256", segredoVerificacao())
    .update(String(valor))
    .digest("hex");
}

function compararHash(valor, hashEsperado) {
  const hash = criarHashVerificacao(valor);
  const atual = Buffer.from(hash);
  const esperado = Buffer.from(hashEsperado || "");
  return atual.length === esperado.length && crypto.timingSafeEqual(atual, esperado);
}

export function gerarCodigoVerificacao() {
  return String(crypto.randomInt(0, 1_000_000)).padStart(6, "0");
}

function limitarUserAgent(userAgent) {
  return typeof userAgent === "string" ? userAgent.slice(0, 255) : null;
}

async function enviarEmailCodigo({ email, codigo }) {
  if (provedorVerificacaoEmail === "mock") {
    console.info(`[email-verification:mock] codigo gerado para ${email}`);
    return { provider: "mock" };
  }

  if (provedorVerificacaoEmail !== "resend") {
    throw new ErroDaAplicacao("Provedor de verificacao de e-mail invalido.", 503);
  }

  return enviarCodigoPorResend({ email, codigo, validadeMinutos: codigoEmailValidadeMinutos });
}

function gerarJwtTemporarioEmail({ verificacao }) {
  return jwt.sign(
    {
      tipo: "email_verificado",
      verificacaoId: verificacao.id,
      email: verificacao.email,
    },
    segredoJwtEmail(),
    { expiresIn: tokenEmailValidadeMinutos * 60 },
  );
}

async function verificarLimitesDeEnvio({ email, enderecoIp, agora }) {
  const inicioJanela = calcularInicioJanelaEnviosEmail(agora);
  const ultimaVerificacao = await repository.buscarUltimaPorEmail(email);

  if (ultimaVerificacao?.reenvioLiberadoEm && ultimaVerificacao.reenvioLiberadoEm > agora) {
    throw new ErroDaAplicacao("Aguarde antes de solicitar um novo codigo.", 429);
  }

  const enviosEmail = await repository.contarEnviosPorEmail({ email, inicioJanela });

  if (enviosEmail >= maxEnviosPorEmail) {
    throw new ErroDaAplicacao("Muitos codigos solicitados para este e-mail. Tente novamente mais tarde.", 429);
  }

  if (enderecoIp) {
    const enviosIp = await repository.contarEnviosPorIp({ enderecoIp, inicioJanela });

    if (enviosIp >= maxEnviosPorIp) {
      throw new ErroDaAplicacao("Muitas solicitacoes deste acesso. Tente novamente mais tarde.", 429);
    }
  }
}

export async function solicitarCodigoEmail({ email, enderecoIp, userAgent }) {
  const emailNormalizado = validarEmail(email);
  const agora = new Date();
  const expiraEm = calcularExpiracaoCodigoEmail(agora);
  const reenvioLiberadoEm = calcularLiberacaoReenvioEmail(agora);
  const codigo = gerarCodigoVerificacao();

  await repository.expirarPendentesVencidas({ email: emailNormalizado, agora });

  await verificarLimitesDeEnvio({ email: emailNormalizado, enderecoIp, agora });

  await repository.expirarPendentesPorEmail(emailNormalizado);

  const verificacao = await repository.criar({
    email: emailNormalizado,
    codigoHash: criarHashVerificacao(codigo),
    status: VERIFICACAO_EMAIL_STATUS.PENDENTE,
    tentativas: 0,
    envios: 1,
    expiraEm,
    reenvioLiberadoEm,
    ultimoEnvioEm: agora,
    enderecoIp: enderecoIp || null,
    userAgent: limitarUserAgent(userAgent),
  });

  try {
    await enviarEmailCodigo({ email: emailNormalizado, codigo });
  } catch (erro) {
    await verificacao.update({ status: VERIFICACAO_EMAIL_STATUS.EXPIRADO }).catch(() => {});
    throw erro;
  }

  return {
    email: emailNormalizado,
    expiraEm,
    reenvioLiberadoEm,
    validadeMinutos: codigoEmailValidadeMinutos,
    intervaloReenvioSegundos: intervaloReenvioEmailSegundos,
  };
}

export async function confirmarCodigoEmail({ email, codigo }) {
  const emailNormalizado = validarEmail(email);
  const codigoNormalizado = validarCodigoVerificacao(codigo);
  const agora = new Date();
  const verificacao = await repository.buscarPendentePorEmail(emailNormalizado);

  if (!verificacao) {
    throw new ErroDaAplicacao("Codigo nao encontrado ou ja utilizado.", 404);
  }

  if (verificacao.expiraEm <= agora) {
    await verificacao.update({ status: VERIFICACAO_EMAIL_STATUS.EXPIRADO });
    throw new ErroDaAplicacao("Codigo expirado. Solicite um novo codigo.", 410);
  }

  if (verificacao.tentativas >= maxTentativasCodigoEmail) {
    await verificacao.update({ status: VERIFICACAO_EMAIL_STATUS.BLOQUEADO });
    throw new ErroDaAplicacao("Limite de tentativas atingido. Solicite um novo codigo.", 429);
  }

  if (!compararHash(codigoNormalizado, verificacao.codigoHash)) {
    const tentativas = verificacao.tentativas + 1;
    const status = tentativas >= maxTentativasCodigoEmail
      ? VERIFICACAO_EMAIL_STATUS.BLOQUEADO
      : VERIFICACAO_EMAIL_STATUS.PENDENTE;
    await verificacao.update({ tentativas, status });
    throw new ErroDaAplicacao(
      status === VERIFICACAO_EMAIL_STATUS.BLOQUEADO
        ? "Limite de tentativas atingido. Solicite um novo codigo."
        : "Codigo invalido.",
      status === VERIFICACAO_EMAIL_STATUS.BLOQUEADO ? 429 : 400,
    );
  }

  const tokenExpiraEm = calcularExpiracaoTokenEmail(agora);
  const jwtTemporario = gerarJwtTemporarioEmail({ verificacao });
  await verificacao.update({
    status: VERIFICACAO_EMAIL_STATUS.VALIDADO,
    validadoEm: agora,
    tokenHash: criarHashVerificacao(jwtTemporario),
    tokenExpiraEm,
  });

  return {
    email: emailNormalizado,
    token: jwtTemporario,
    validadoEm: agora,
    tokenExpiraEm,
  };
}

export async function validarTokenTemporarioEmail({ token, transaction = null, lock = false }) {
  if (typeof token !== "string" || token.trim().length < 32) {
    throw new ErroDaAplicacao("Valide o e-mail antes de continuar.", 403);
  }

  let payload;
  try {
    payload = jwt.verify(token.trim(), segredoJwtEmail());
  } catch {
    throw new ErroDaAplicacao("Validacao de e-mail expirada ou invalida.", 401);
  }

  if (payload?.tipo !== "email_verificado" || !payload.verificacaoId) {
    throw new ErroDaAplicacao("Token de validacao de e-mail invalido.", 401);
  }

  const emailNormalizado = validarEmail(payload.email);
  const verificacao = await repository.buscarValidadaPorToken({
    email: emailNormalizado,
    tokenHash: criarHashVerificacao(token.trim()),
    verificacaoId: payload.verificacaoId,
    agora: new Date(),
    transaction,
    lock,
  });

  if (!verificacao) {
    throw new ErroDaAplicacao("Valide o e-mail antes de continuar.", 403);
  }

  return {
    email: emailNormalizado,
    verificacaoId: verificacao.id,
    validadoEm: verificacao.validadoEm,
    tokenExpiraEm: verificacao.tokenExpiraEm,
    token: token.trim(),
  };
}
