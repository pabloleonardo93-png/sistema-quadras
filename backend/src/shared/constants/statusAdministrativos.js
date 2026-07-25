export const ADMIN_PERMISSAO = Object.freeze({
  ADMINISTRADOR: "administrador",
  GERENTE: "gerente",
});

export const ADMIN_PERMISSAO_LISTA = Object.freeze(Object.values(ADMIN_PERMISSAO));

export const ADMIN_STATUS = Object.freeze({
  ATIVO: "ativo",
  INATIVO: "inativo",
});

export const ADMIN_STATUS_LISTA = Object.freeze(Object.values(ADMIN_STATUS));

export const CLIENTE_STATUS = Object.freeze({
  ATIVO: "ativo",
  INATIVO: "inativo",
});

export const CLIENTE_STATUS_LISTA = Object.freeze(Object.values(CLIENTE_STATUS));

export const QUADRA_STATUS = Object.freeze({
  ATIVA: "ativa",
  MANUTENCAO: "manutencao",
  INATIVA: "inativa",
});

export const QUADRA_STATUS_LISTA = Object.freeze(Object.values(QUADRA_STATUS));

export const MODALIDADE_STATUS = Object.freeze({
  ATIVA: "ativa",
  INATIVA: "inativa",
});

export const MODALIDADE_STATUS_LISTA = Object.freeze(Object.values(MODALIDADE_STATUS));

export const HORARIO_STATUS = Object.freeze({
  DISPONIVEL: "disponivel",
  RESERVADO: "reservado",
  BLOQUEADO: "bloqueado",
});

export const HORARIO_STATUS_LISTA = Object.freeze(Object.values(HORARIO_STATUS));

export const COMUNICADO_STATUS = Object.freeze({
  RASCUNHO: "rascunho",
  PUBLICADO: "publicado",
  ARQUIVADO: "arquivado",
});

export const COMUNICADO_STATUS_LISTA = Object.freeze(Object.values(COMUNICADO_STATUS));
