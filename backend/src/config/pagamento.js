const MINUTOS_PADRAO_PAGAMENTO = 10;
const INTERVALO_PADRAO_EXPIRACAO_MS = 60_000;

function numeroPositivo(valor, fallback) {
  const numero = Number(valor);
  return Number.isFinite(numero) && numero > 0 ? numero : fallback;
}

export const tempoPagamentoMinutos = numeroPositivo(
  process.env.RESERVA_PAGAMENTO_TEMPO_MINUTOS,
  MINUTOS_PADRAO_PAGAMENTO,
);

export const intervaloExpiracaoPagamentosMs = numeroPositivo(
  process.env.RESERVA_EXPIRACAO_INTERVALO_MS,
  INTERVALO_PADRAO_EXPIRACAO_MS,
);

export function calcularPagamentoExpiraEm(dataBase = new Date()) {
  const data = dataBase instanceof Date ? dataBase : new Date(dataBase);
  if (Number.isNaN(data.getTime())) return null;
  return new Date(data.getTime() + tempoPagamentoMinutos * 60_000);
}

export function calcularCorteExpiracao(agora = new Date()) {
  const data = agora instanceof Date ? agora : new Date(agora);
  if (Number.isNaN(data.getTime())) return null;
  return new Date(data.getTime() - tempoPagamentoMinutos * 60_000);
}
