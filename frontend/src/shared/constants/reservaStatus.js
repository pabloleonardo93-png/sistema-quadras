export const RESERVA_STATUS = Object.freeze({
  AGUARDANDO_PAGAMENTO: "aguardando_pagamento",
  CONFIRMADA: "confirmada",
  CANCELADA: "cancelada",
  EXPIRADA: "expirada",
  FINALIZADA: "finalizada",
});

export const RESERVA_STATUS_LABELS = Object.freeze({
  [RESERVA_STATUS.AGUARDANDO_PAGAMENTO]: "Aguardando pagamento",
  [RESERVA_STATUS.CONFIRMADA]: "Confirmada",
  [RESERVA_STATUS.CANCELADA]: "Cancelada",
  [RESERVA_STATUS.EXPIRADA]: "Expirada",
  [RESERVA_STATUS.FINALIZADA]: "Finalizada",
});

export const RESERVA_STATUS_RETURN_LABELS = Object.freeze({
  [RESERVA_STATUS.AGUARDANDO_PAGAMENTO]: "Aguardando pagamento",
  [RESERVA_STATUS.CONFIRMADA]: "Reserva confirmada",
  [RESERVA_STATUS.CANCELADA]: "Reserva cancelada",
  [RESERVA_STATUS.EXPIRADA]: "Reserva expirada",
  [RESERVA_STATUS.FINALIZADA]: "Reserva finalizada",
});

export const RESERVA_STATUS_FILTRO_ADMIN = Object.freeze([
  RESERVA_STATUS.CONFIRMADA,
  RESERVA_STATUS.AGUARDANDO_PAGAMENTO,
  RESERVA_STATUS.CANCELADA,
  RESERVA_STATUS.FINALIZADA,
  RESERVA_STATUS.EXPIRADA,
]);

export function labelReservaStatus(status, fallback = "--") {
  return RESERVA_STATUS_LABELS[status] || status || fallback;
}

export function labelReservaStatusRetorno(status) {
  return RESERVA_STATUS_RETURN_LABELS[status] || status;
}
