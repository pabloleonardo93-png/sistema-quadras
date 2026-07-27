import crypto from "node:crypto";
import jwt from "jsonwebtoken";
import { Op } from "sequelize";
import sequelize from "../config/database.js";
import {
  calcularExpiracaoCodigoEmail,
  calcularExpiracaoTokenEmail,
  calcularLiberacaoReenvioEmail,
  codigoEmailValidadeMinutos,
  intervaloReenvioEmailSegundos,
  janelaEnviosEmailMinutos,
  maxEnviosPorEmail,
  maxEnviosPorIp,
  maxTentativasCodigoEmail,
  provedorVerificacaoEmail,
  tokenEmailValidadeMinutos,
} from "../config/verificacaoEmail.js";
import VerificacaoEmail from "../models/VerificacaoEmail.js";
import ErroDaAplicacao from "../utils/ErroDaAplicacao.js";
import { validarEmail } from "../utils/validacoes.js";
import { enviarCodigoPorResend } from "./resendService.js";
import { limitarOperacaoPersistente } from "./limitePersistenteService.js";

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

function validarCodigo(codigo) {
  if (typeof codigo !== "string" || !/^\d{6}$/.test(codigo.trim())) {
    throw new ErroDaAplicacao("Informe o codigo de 6 digitos.");
  }
  return codigo.trim();
}

function limitarUserAgent(userAgent) {
  return typeof userAgent === "string" ? userAgent.slice(0, 255) : null;
}

async function enviarEmailCodigo({ email, codigo }) {
  if (provedorVerificacaoEmail === "mock") {
    console.info("[email-verification:mock] codigo gerado");
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

export async function solicitarCodigoEmail({ email, enderecoIp, userAgent }) {
  const emailNormalizado = validarEmail(email);
  const codigo = gerarCodigoVerificacao();
  const { verificacao, expiraEm, reenvioLiberadoEm } = await sequelize.transaction(async (transaction) => {
    const agora = new Date();
    const expiraEm = calcularExpiracaoCodigoEmail(agora);
    const reenvioLiberadoEm = calcularLiberacaoReenvioEmail(agora);

    // Todos os contadores entram na mesma transacao: uma tentativa bloqueada nao consome outro limite.
    await limitarOperacaoPersistente({
      operacao: "envio_codigo_email",
      identificadores: [{ tipo: "email", valor: emailNormalizado }],
      limite: maxEnviosPorEmail,
      janelaMinutos: janelaEnviosEmailMinutos,
      transaction,
    });
    if (enderecoIp) {
      await limitarOperacaoPersistente({
        operacao: "envio_codigo_ip",
        identificadores: [{ tipo: "ip", valor: enderecoIp }],
        limite: maxEnviosPorIp,
        janelaMinutos: janelaEnviosEmailMinutos,
        transaction,
      });
    }

    const ultimaVerificacao = await VerificacaoEmail.findOne({
      where: { email: emailNormalizado },
      order: [["criadoEm", "DESC"]],
      transaction,
      lock: transaction.LOCK.UPDATE,
    });
    if (ultimaVerificacao?.reenvioLiberadoEm && ultimaVerificacao.reenvioLiberadoEm > agora) {
      throw new ErroDaAplicacao("Aguarde antes de solicitar um novo codigo.", 429);
    }

    await VerificacaoEmail.update(
      { status: "expirado" },
      { where: { email: emailNormalizado, status: "pendente" }, transaction },
    );

    const verificacao = await VerificacaoEmail.create({
      email: emailNormalizado,
      codigoHash: criarHashVerificacao(codigo),
      status: "pendente",
      tentativas: 0,
      envios: 1,
      expiraEm,
      reenvioLiberadoEm,
      ultimoEnvioEm: agora,
      enderecoIp: enderecoIp || null,
      userAgent: limitarUserAgent(userAgent),
    }, { transaction });

    return { verificacao, expiraEm, reenvioLiberadoEm };
  });

  try {
    await enviarEmailCodigo({ email: emailNormalizado, codigo });
  } catch (erro) {
    await verificacao.update({ status: "expirado" }).catch(() => {});
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

export async function confirmarCodigoEmail({ email, codigo, enderecoIp = null }) {
  const emailNormalizado = validarEmail(email);
  const codigoNormalizado = validarCodigo(codigo);
  return sequelize.transaction(async (transaction) => {
    await limitarOperacaoPersistente({
      operacao: "confirmar_email",
      identificadores: [
        { tipo: "email", valor: emailNormalizado },
        ...(enderecoIp ? [{ tipo: "ip", valor: enderecoIp }] : []),
      ],
      transaction,
    });

    const agora = new Date();
    const verificacao = await VerificacaoEmail.findOne({
      where: { email: emailNormalizado, status: "pendente" },
      order: [["criadoEm", "DESC"]],
      transaction,
      lock: transaction.LOCK.UPDATE,
    });

    if (!verificacao) throw new ErroDaAplicacao("Codigo nao encontrado ou ja utilizado.", 404);
    if (verificacao.expiraEm <= agora) {
      await verificacao.update({ status: "expirado" }, { transaction });
      throw new ErroDaAplicacao("Codigo expirado. Solicite um novo codigo.", 410);
    }
    if (verificacao.tentativas >= maxTentativasCodigoEmail) {
      await verificacao.update({ status: "bloqueado" }, { transaction });
      throw new ErroDaAplicacao("Limite de tentativas atingido. Solicite um novo codigo.", 429);
    }
    if (!compararHash(codigoNormalizado, verificacao.codigoHash)) {
      const tentativas = verificacao.tentativas + 1;
      const status = tentativas >= maxTentativasCodigoEmail ? "bloqueado" : "pendente";
      await verificacao.update({ tentativas, status }, { transaction });
      throw new ErroDaAplicacao(status === "bloqueado" ? "Limite de tentativas atingido. Solicite um novo codigo." : "Codigo invalido.", status === "bloqueado" ? 429 : 400);
    }

    const tokenExpiraEm = calcularExpiracaoTokenEmail(agora);
    const jwtTemporario = gerarJwtTemporarioEmail({ verificacao });
    await verificacao.update({ status: "validado", validadoEm: agora, tokenHash: criarHashVerificacao(jwtTemporario), tokenExpiraEm }, { transaction });
    return { email: emailNormalizado, token: jwtTemporario, validadoEm: agora, tokenExpiraEm };
  });
}

export async function revogarTokenTemporarioEmail({ token }) {
  return sequelize.transaction(async (transaction) => {
    const sessao = await validarTokenTemporarioEmail({ token, transaction, lock: true });
    await VerificacaoEmail.update({ status: "revogado", tokenHash: null, tokenExpiraEm: new Date() }, {
      where: { id: sessao.verificacaoId, status: "validado" },
      transaction,
    });
  });
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
  const verificacao = await VerificacaoEmail.findOne({
    where: {
      email: emailNormalizado,
      tokenHash: criarHashVerificacao(token.trim()),
      status: "validado",
      tokenExpiraEm: { [Op.gt]: new Date() },
      id: payload.verificacaoId,
    },
    transaction,
    lock: lock && transaction ? transaction.LOCK.UPDATE : undefined,
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
