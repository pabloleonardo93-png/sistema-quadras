import { QUADRA_STATUS_LISTA } from "../../shared/constants/statusAdministrativos.js";
import { validarId, validarStatus, validarTexto, validarValorPositivo } from "../../utils/validacoes.js";
import ErroDaAplicacao from "../../utils/ErroDaAplicacao.js";

function dadosDaQuadra(corpo) {
  return {
    nome: validarTexto(corpo.nome, "Nome da quadra", 100),
    descricao: typeof corpo.descricao === "string" ? corpo.descricao.trim() || null : null,
    valorHora: validarValorPositivo(corpo.valorHora, "Valor por hora"),
    imagemUrl: typeof corpo.imagemUrl === "string" ? corpo.imagemUrl.trim() || null : null,
  };
}

function validarModalidadesIds(ids) {
  if (!Array.isArray(ids) || ids.length === 0) {
    throw new ErroDaAplicacao("Informe ao menos uma modalidade para a quadra.");
  }
  return [...new Set(ids.map((id) => validarId(id, "Modalidade")))];
}

export function validarIdQuadra(req, _res, next) {
  req.dadosValidados = {
    ...req.dadosValidados,
    quadra: {
      ...req.dadosValidados?.quadra,
      id: validarId(req.params.id, "Quadra"),
    },
  };
  next();
}

export function validarDadosQuadra(req, _res, next) {
  req.dadosValidados = {
    ...req.dadosValidados,
    quadra: {
      ...req.dadosValidados?.quadra,
      dados: dadosDaQuadra(req.body),
      modalidadesIds: validarModalidadesIds(req.body.modalidadesIds),
    },
  };
  next();
}

export function validarStatusQuadra(req, _res, next) {
  req.dadosValidados = {
    ...req.dadosValidados,
    quadra: {
      ...req.dadosValidados?.quadra,
      status: validarStatus(req.body.status, QUADRA_STATUS_LISTA),
    },
  };
  next();
}
