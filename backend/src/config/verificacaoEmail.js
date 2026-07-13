const MINUTOS_PADRAO_CODIGO = 10;
const SEGUNDOS_PADRAO_REENVIO = 60;
const TENTATIVAS_PADRAO = 5;
const MINUTOS_PADRAO_JANELA = 60;
const ENVIOS_PADRAO_EMAIL = 5;
const ENVIOS_PADRAO_IP = 30;
const DIAS_PADRAO_SESSAO = 90;

function numeroPositivo(valor, fallback) {
  const numero = Number(valor);
  return Number.isFinite(numero) && numero > 0 ? numero : fallback;
}

export const codigoEmailValidadeMinutos = numeroPositivo(
  process.env.CODIGO_VERIFICACAO_EXPIRACAO_MINUTOS ||
    process.env.EMAIL_VERIFICATION_CODE_TTL_MINUTES,
  MINUTOS_PADRAO_CODIGO,
);

export const intervaloReenvioEmailSegundos = numeroPositivo(
  process.env.EMAIL_VERIFICATION_RESEND_SECONDS,
  SEGUNDOS_PADRAO_REENVIO,
);

export const maxTentativasCodigoEmail = numeroPositivo(
  process.env.EMAIL_VERIFICATION_MAX_ATTEMPTS,
  TENTATIVAS_PADRAO,
);

export const janelaEnviosEmailMinutos = numeroPositivo(
  process.env.EMAIL_VERIFICATION_RATE_WINDOW_MINUTES,
  MINUTOS_PADRAO_JANELA,
);

export const maxEnviosPorEmail = numeroPositivo(
  process.env.EMAIL_VERIFICATION_MAX_SENDS_PER_EMAIL,
  ENVIOS_PADRAO_EMAIL,
);

export const maxEnviosPorIp = numeroPositivo(
  process.env.EMAIL_VERIFICATION_MAX_SENDS_PER_IP,
  ENVIOS_PADRAO_IP,
);

export const sessaoEmailValidadeDias = numeroPositivo(
  process.env.EMAIL_VERIFICATION_SESSION_DAYS,
  DIAS_PADRAO_SESSAO,
);

export const tokenEmailValidadeMinutos = numeroPositivo(
  process.env.EMAIL_VERIFICATION_TOKEN_TTL_MINUTES,
  sessaoEmailValidadeDias * 24 * 60,
);

export const provedorVerificacaoEmail = (
  process.env.EMAIL_VERIFICATION_PROVIDER ||
  (process.env.RESEND_API_KEY ? "resend" : "mock")
).toLowerCase();

export const resendFromEmail = process.env.EMAIL_FROM || process.env.RESEND_FROM_EMAIL || "";
export const resendTemplateVerificacaoId = process.env.RESEND_TEMPLATE_VERIFICACAO_ID || "";
export const emailVerificacaoCookieNome =
  process.env.EMAIL_VERIFICATION_COOKIE_NAME || "email_verification_token";
export const emailVerificacaoCookieMaxAgeMs = tokenEmailValidadeMinutos * 60_000;

function somarTempo(dataBase, quantidade, multiplicador) {
  const data = dataBase instanceof Date ? dataBase : new Date(dataBase);
  if (Number.isNaN(data.getTime())) return null;
  return new Date(data.getTime() + quantidade * multiplicador);
}

export function calcularExpiracaoCodigoEmail(dataBase = new Date()) {
  return somarTempo(dataBase, codigoEmailValidadeMinutos, 60_000);
}

export function calcularLiberacaoReenvioEmail(dataBase = new Date()) {
  return somarTempo(dataBase, intervaloReenvioEmailSegundos, 1000);
}

export function calcularInicioJanelaEnviosEmail(dataBase = new Date()) {
  const data = dataBase instanceof Date ? dataBase : new Date(dataBase);
  if (Number.isNaN(data.getTime())) return null;
  return new Date(data.getTime() - janelaEnviosEmailMinutos * 60_000);
}

export function calcularExpiracaoTokenEmail(dataBase = new Date()) {
  return somarTempo(dataBase, tokenEmailValidadeMinutos, 60_000);
}
