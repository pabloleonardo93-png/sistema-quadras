const MENSAGEM_LIMITE_EXCEDIDO = "Muitas solicitacoes. Tente novamente mais tarde.";

function numeroPositivo(valor, fallback) {
  const numero = Number(valor);
  return Number.isFinite(numero) && numero > 0 ? Math.floor(numero) : fallback;
}

function configuracao(prefixo, padrao) {
  return {
    janelaMs: numeroPositivo(process.env[`${prefixo}_WINDOW_MS`], padrao.janelaMs),
    maximo: numeroPositivo(process.env[`${prefixo}_MAX`], padrao.maximo),
  };
}

export function criarRateLimiter({
  janelaMs,
  maximo,
  agora = () => Date.now(),
  chave = (req) => req.ip || "desconhecido",
} = {}) {
  const limites = new Map();

  return (req, res, next) => {
    const momento = agora();
    const chaveLimite = String(chave(req));
    const atual = limites.get(chaveLimite);
    const limite = !atual || momento >= atual.expiraEm
      ? { quantidade: 0, expiraEm: momento + janelaMs }
      : atual;

    if (limite.quantidade >= maximo) {
      const segundosRestantes = Math.max(1, Math.ceil((limite.expiraEm - momento) / 1000));
      res.set("Retry-After", String(segundosRestantes));
      return res.status(429).json({ erro: MENSAGEM_LIMITE_EXCEDIDO });
    }

    limite.quantidade += 1;
    limites.set(chaveLimite, limite);
    return next();
  };
}

export const limitarRegistroAcessoPublico = criarRateLimiter(
  configuracao("RATE_LIMIT_ANALYTICS", { janelaMs: 60_000, maximo: 120 }),
);

export const limitarEnvioCodigoEmail = criarRateLimiter(
  configuracao("RATE_LIMIT_EMAIL_SEND", { janelaMs: 15 * 60_000, maximo: 20 }),
);

export const limitarConfirmacaoCodigoEmail = criarRateLimiter(
  configuracao("RATE_LIMIT_EMAIL_CONFIRM", { janelaMs: 15 * 60_000, maximo: 30 }),
);

export const limitarCriacaoReservaPublica = criarRateLimiter(
  configuracao("RATE_LIMIT_RESERVA", { janelaMs: 10 * 60_000, maximo: 30 }),
);

export const limitarCriacaoPagamentoPublico = criarRateLimiter(
  configuracao("RATE_LIMIT_PAGAMENTO", { janelaMs: 10 * 60_000, maximo: 30 }),
);

export const limitarLoginAdministrativo = criarRateLimiter(
  configuracao("RATE_LIMIT_LOGIN", { janelaMs: 15 * 60_000, maximo: 10 }),
);
