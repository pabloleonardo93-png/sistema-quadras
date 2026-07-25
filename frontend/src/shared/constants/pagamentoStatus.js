export const PAGAMENTO_STATUS = Object.freeze({
  PENDENTE: "pendente",
  APROVADO: "aprovado",
  RECUSADO: "recusado",
  CANCELADO: "cancelado",
  ESTORNADO: "estornado",
});

export const PAGAMENTO_STATUS_LABELS = Object.freeze({
  [PAGAMENTO_STATUS.PENDENTE]: "Pendente",
  [PAGAMENTO_STATUS.APROVADO]: "Aprovado",
  [PAGAMENTO_STATUS.RECUSADO]: "Recusado",
  [PAGAMENTO_STATUS.CANCELADO]: "Cancelado",
  [PAGAMENTO_STATUS.ESTORNADO]: "Estornado",
});

export const PAGAMENTO_STATUS_RETURN_LABELS = Object.freeze({
  [PAGAMENTO_STATUS.PENDENTE]: "Pagamento pendente",
  [PAGAMENTO_STATUS.APROVADO]: "Pagamento aprovado",
  [PAGAMENTO_STATUS.RECUSADO]: "Pagamento recusado",
  [PAGAMENTO_STATUS.CANCELADO]: "Pagamento cancelado",
  [PAGAMENTO_STATUS.ESTORNADO]: "Pagamento estornado",
});

export const PAGAMENTO_STATUS_PAINEL_LABELS = Object.freeze({
  [PAGAMENTO_STATUS.APROVADO]: "Pago",
  [PAGAMENTO_STATUS.PENDENTE]: "Pendente",
  [PAGAMENTO_STATUS.RECUSADO]: "Não pago",
  [PAGAMENTO_STATUS.CANCELADO]: "Cancelado",
  [PAGAMENTO_STATUS.ESTORNADO]: "Estornado",
});

export const PAGAMENTO_STATUS_NAO_CONFIRMADOS = Object.freeze([
  PAGAMENTO_STATUS.RECUSADO,
  PAGAMENTO_STATUS.CANCELADO,
  PAGAMENTO_STATUS.ESTORNADO,
]);

export function labelPagamentoStatus(status, fallback = "--") {
  return PAGAMENTO_STATUS_LABELS[status] || status || fallback;
}

export function labelPagamentoStatusRetorno(status) {
  return PAGAMENTO_STATUS_RETURN_LABELS[status] || status;
}

export function labelPagamentoStatusPainel(status) {
  return PAGAMENTO_STATUS_PAINEL_LABELS[status] || "Não pago";
}
