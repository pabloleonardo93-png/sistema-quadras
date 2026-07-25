import { COMUNICADO_STATUS_LISTA } from "../../shared/constants/statusAdministrativos.js";
import { validarId, validarStatus, validarTexto } from "../../utils/validacoes.js";

function dadosDoComunicado(corpo) {
  return {
    titulo: validarTexto(corpo.titulo, "TÃ­tulo", 180),
    mensagem: validarTexto(corpo.mensagem, "Mensagem", 10000),
    destaque: Boolean(corpo.destaque),
  };
}

export function validarDadosComunicado(req, _res, next) {
  req.dadosValidados = {
    ...req.dadosValidados,
    comunicado: {
      ...req.dadosValidados?.comunicado,
      dados: dadosDoComunicado(req.body),
    },
  };
  next();
}

export function validarFiltroComunicados(req, _res, next) {
  req.dadosValidados = {
    ...req.dadosValidados,
    comunicado: {
      ...req.dadosValidados?.comunicado,
      status: req.query.status ? validarStatus(req.query.status, COMUNICADO_STATUS_LISTA) : undefined,
    },
  };
  next();
}

export function validarIdComunicado(req, _res, next) {
  req.dadosValidados = {
    ...req.dadosValidados,
    comunicado: {
      ...req.dadosValidados?.comunicado,
      id: validarId(req.params.id, "Comunicado"),
    },
  };
  next();
}
