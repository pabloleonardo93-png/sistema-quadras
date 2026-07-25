export const QUADRA_STATUS = Object.freeze({
  ATIVA: "ativa",
  MANUTENCAO: "manutencao",
  INATIVA: "inativa",
});

export const QUADRA_STATUS_LABELS = Object.freeze({
  [QUADRA_STATUS.ATIVA]: "Ativa",
  [QUADRA_STATUS.MANUTENCAO]: "Manutenção",
  [QUADRA_STATUS.INATIVA]: "Inativa",
});

export const HORARIO_STATUS = Object.freeze({
  DISPONIVEL: "disponivel",
  RESERVADO: "reservado",
  BLOQUEADO: "bloqueado",
});

export const HORARIO_STATUS_LABELS = Object.freeze({
  [HORARIO_STATUS.DISPONIVEL]: "Livre",
  [HORARIO_STATUS.RESERVADO]: "Reservado",
  [HORARIO_STATUS.BLOQUEADO]: "Bloqueado",
});

export const HORARIO_STATUS_CLASSES = Object.freeze({
  [HORARIO_STATUS.DISPONIVEL]: "livre",
  [HORARIO_STATUS.RESERVADO]: "reservado",
  [HORARIO_STATUS.BLOQUEADO]: "bloqueado",
});

export const MODALIDADE_STATUS = Object.freeze({
  ATIVA: "ativa",
  INATIVA: "inativa",
});

export const MODALIDADE_STATUS_LABELS = Object.freeze({
  [MODALIDADE_STATUS.ATIVA]: "Ativa",
  [MODALIDADE_STATUS.INATIVA]: "Inativa",
});

export const CLIENTE_STATUS = Object.freeze({
  ATIVO: "ativo",
  INATIVO: "inativo",
});

export const CLIENTE_STATUS_LABELS = Object.freeze({
  [CLIENTE_STATUS.ATIVO]: "Ativo",
  [CLIENTE_STATUS.INATIVO]: "Inativo",
});

export const COMUNICADO_STATUS_LABELS = Object.freeze({
  rascunho: "Rascunho",
  publicado: "Publicado",
  arquivado: "Arquivado",
});

export function labelQuadraStatus(status, fallback = "--") {
  return QUADRA_STATUS_LABELS[status] || status || fallback;
}

export function labelHorarioStatus(status, fallback = "--") {
  return HORARIO_STATUS_LABELS[status] || status || fallback;
}

export function classeHorarioStatus(status) {
  return HORARIO_STATUS_CLASSES[status] || HORARIO_STATUS_CLASSES[HORARIO_STATUS.DISPONIVEL];
}

export function labelModalidadeStatus(status, fallback = "--") {
  return MODALIDADE_STATUS_LABELS[status] || status || fallback;
}

export function labelClienteStatus(status, fallback = "--") {
  return CLIENTE_STATUS_LABELS[status] || status || fallback;
}

export function labelComunicadoStatus(status, fallback = "--") {
  return COMUNICADO_STATUS_LABELS[status] || status || fallback;
}
