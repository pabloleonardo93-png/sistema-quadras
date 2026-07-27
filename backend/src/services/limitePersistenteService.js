import crypto from "node:crypto";
import { QueryTypes } from "sequelize";
import sequelize from "../config/database.js";
import ErroDaAplicacao from "../utils/ErroDaAplicacao.js";

function numeroPositivo(valor, fallback) {
  const numero = Number(valor);
  return Number.isFinite(numero) && numero > 0 ? numero : fallback;
}

function segredo() {
  return process.env.SECURITY_RATE_LIMIT_SECRET || process.env.EMAIL_VERIFICATION_SECRET || process.env.JWT_SECRET || "dev-security-rate-limit";
}

function hashIdentificador(valor) {
  return crypto.createHmac("sha256", segredo()).update(String(valor)).digest("hex");
}

function inicioDaJanela(agora, janelaMinutos) {
  const janelaMs = janelaMinutos * 60_000;
  return new Date(Math.floor(agora.getTime() / janelaMs) * janelaMs);
}

export const limitesCriticos = {
  confirmarEmail: {
    limite: numeroPositivo(process.env.EMAIL_VERIFICATION_MAX_CONFIRM_ATTEMPTS_PER_WINDOW, 10),
    janelaMinutos: numeroPositivo(process.env.EMAIL_VERIFICATION_CONFIRM_RATE_WINDOW_MINUTES, 60),
  },
  dadosCliente: {
    limite: numeroPositivo(process.env.CLIENTE_DADOS_MAX_ATTEMPTS_PER_EMAIL, 20),
    janelaMinutos: numeroPositivo(process.env.CLIENTE_DADOS_RATE_WINDOW_MINUTES, 60),
  },
  reserva: {
    limite: numeroPositivo(process.env.RESERVA_CREATE_MAX_ATTEMPTS_PER_WINDOW, 12),
    janelaMinutos: numeroPositivo(process.env.RESERVA_CREATE_RATE_WINDOW_MINUTES, 60),
  },
  pagamento: {
    limite: numeroPositivo(process.env.PAGAMENTO_CREATE_MAX_ATTEMPTS_PER_WINDOW, 12),
    janelaMinutos: numeroPositivo(process.env.PAGAMENTO_CREATE_RATE_WINDOW_MINUTES, 60),
  },
};

async function consumirLimite({ chave, limite, janelaMinutos, agora, transaction }) {
  const inicioJanela = inicioDaJanela(agora, janelaMinutos);
  const expiraEm = new Date(inicioJanela.getTime() + janelaMinutos * 60_000);
  const registros = await sequelize.query(
    `INSERT INTO limites_seguranca (chave, inicio_janela, expira_em, quantidade, criado_em, atualizado_em)
     VALUES (:chave, :inicioJanela, :expiraEm, 1, NOW(), NOW())
     ON CONFLICT (chave, inicio_janela)
     DO UPDATE SET quantidade = limites_seguranca.quantidade + 1, atualizado_em = NOW()
     WHERE limites_seguranca.quantidade < :limite
     RETURNING quantidade`,
    {
      replacements: { chave, inicioJanela, expiraEm, limite },
      type: QueryTypes.SELECT,
      transaction,
    },
  );

  if (!registros.length) {
    throw new ErroDaAplicacao("Muitas tentativas. Tente novamente mais tarde.", 429);
  }
}

export async function limitarOperacaoPersistente({ operacao, identificadores = [], limite, janelaMinutos, transaction = null }) {
  const config = limitesCriticos[operacao] || {};
  const limiteFinal = numeroPositivo(limite, config.limite || 10);
  const janelaFinal = numeroPositivo(janelaMinutos, config.janelaMinutos || 60);
  const chaves = [...new Set(identificadores.filter(Boolean).map(({ tipo, valor }) => `${operacao}:${tipo}:${hashIdentificador(valor)}`))];
  if (!chaves.length) return;

  const executar = async (tx) => {
    const agora = new Date();
    for (const chave of chaves) {
      await consumirLimite({ chave, limite: limiteFinal, janelaMinutos: janelaFinal, agora, transaction: tx });
    }
  };

  if (transaction) return executar(transaction);
  return sequelize.transaction(executar);
}
