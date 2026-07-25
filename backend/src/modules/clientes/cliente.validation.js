import { CLIENTE_STATUS_LISTA } from "../../shared/constants/statusAdministrativos.js";
import {
  validarEmail,
  validarId,
  validarStatus,
  validarTelefoneBrasil,
  validarTexto,
} from "../../utils/validacoes.js";

export function dadosDoCliente(corpo) {
  return {
    nome: validarTexto(corpo.nome, "Nome", 120),
    telefone: validarTelefoneBrasil(corpo.telefone),
    email: validarEmail(corpo.email),
  };
}

export function validarCriacaoPublica(req, _res, next) {
  req.dadosValidados = {
    ...req.dadosValidados,
    cliente: {
      nome: req.body.nome,
      telefone: req.body.telefone,
      email: req.emailVerificado.email,
      validadoEm: req.emailVerificado.validadoEm,
    },
  };
  next();
}

export function validarPerfilVerificado(req, _res, next) {
  req.dadosValidados = {
    ...req.dadosValidados,
    cliente: {
      email: validarEmail(req.emailVerificado.email),
    },
  };
  next();
}

export function validarListagem(req, _res, next) {
  req.dadosValidados = {
    ...req.dadosValidados,
    cliente: {
      status: req.query.status ? validarStatus(req.query.status, CLIENTE_STATUS_LISTA) : undefined,
      busca: req.query.busca ? req.query.busca.trim() : undefined,
    },
  };
  next();
}

export function validarIdCliente(req, _res, next) {
  req.dadosValidados = {
    ...req.dadosValidados,
    cliente: {
      ...req.dadosValidados?.cliente,
      id: validarId(req.params.id, "Cliente"),
    },
  };
  next();
}

export function validarAtualizacao(req, _res, next) {
  req.dadosValidados = {
    ...req.dadosValidados,
    cliente: {
      ...req.dadosValidados?.cliente,
      dados: dadosDoCliente(req.body),
    },
  };
  next();
}

export function validarAlteracaoStatus(req, _res, next) {
  req.dadosValidados = {
    ...req.dadosValidados,
    cliente: {
      ...req.dadosValidados?.cliente,
      status: validarStatus(req.body.status, CLIENTE_STATUS_LISTA),
    },
  };
  next();
}
