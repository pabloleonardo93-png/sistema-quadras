import { MODALIDADE_STATUS_LISTA } from "../../shared/constants/statusAdministrativos.js";
import { validarId, validarStatus, validarTexto } from "../../utils/validacoes.js";

function dadosDaModalidade(corpo) {
  return {
    nome: validarTexto(corpo.nome, "Nome da modalidade", 100),
    descricao: typeof corpo.descricao === "string" ? corpo.descricao.trim() || null : null,
  };
}

export function validarIdModalidade(req, _res, next) {
  req.dadosValidados = {
    ...req.dadosValidados,
    modalidade: {
      ...req.dadosValidados?.modalidade,
      id: validarId(req.params.id, "Modalidade"),
    },
  };
  next();
}

export function validarDadosModalidade(req, _res, next) {
  req.dadosValidados = {
    ...req.dadosValidados,
    modalidade: {
      ...req.dadosValidados?.modalidade,
      dados: dadosDaModalidade(req.body),
    },
  };
  next();
}

export function validarStatusModalidade(req, _res, next) {
  req.dadosValidados = {
    ...req.dadosValidados,
    modalidade: {
      ...req.dadosValidados?.modalidade,
      status: validarStatus(req.body.status, MODALIDADE_STATUS_LISTA),
    },
  };
  next();
}
