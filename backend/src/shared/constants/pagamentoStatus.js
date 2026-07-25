export const PAGAMENTO_STATUS = Object.freeze({
  PENDENTE: "pendente",
  APROVADO: "aprovado",
  RECUSADO: "recusado",
  CANCELADO: "cancelado",
  ESTORNADO: "estornado",
});

export const PAGAMENTO_STATUS_LISTA = Object.freeze(Object.values(PAGAMENTO_STATUS));

export const PAGAMENTO_STATUS_ENCERRADOS_SEM_APROVACAO = Object.freeze([
  PAGAMENTO_STATUS.CANCELADO,
  PAGAMENTO_STATUS.RECUSADO,
  PAGAMENTO_STATUS.ESTORNADO,
]);
