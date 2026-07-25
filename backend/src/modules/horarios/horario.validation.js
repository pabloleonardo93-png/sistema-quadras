import funcionamento from "../../shared/constants/funcionamento.cjs";
import { HORARIO_STATUS_LISTA } from "../../shared/constants/statusAdministrativos.js";
import { hojeLocal, validarData, validarHora, validarId, validarStatus } from "../../utils/validacoes.js";

const { HORA_ABERTURA, HORA_FECHAMENTO, funcionaNaData } = funcionamento;

export function validarCriacaoHorario(req, _res, next) {
  req.dadosValidados = {
    ...req.dadosValidados,
    horario: {
      quadraId: validarId(req.body.quadraId, "Quadra"),
      data: validarData(req.body.data),
      horaInicio: validarHora(req.body.horaInicio, "Hora inicial"),
      horaFim: validarHora(req.body.horaFim, "Hora final"),
    },
  };
  next();
}

export function validarListagemHorarios(req, _res, next) {
  const filtros = {};
  const quadraId = req.query.quadraId || req.query.quadra_id;
  if (quadraId) filtros.quadraId = validarId(quadraId, "Quadra");
  if (req.query.data) filtros.data = validarData(req.query.data);
  if (req.query.status) filtros.status = validarStatus(req.query.status, HORARIO_STATUS_LISTA);

  req.dadosValidados = {
    ...req.dadosValidados,
    filtrosHorarios: filtros,
  };
  next();
}

export function validarListagemDisponiveis(req, _res, next) {
  const filtros = {};
  const quadraId = req.query.quadraId || req.query.quadra_id;
  if (quadraId) filtros.quadraId = validarId(quadraId, "Quadra");
  filtros.data = req.query.data ? validarData(req.query.data) : { __hojeOuFuturo: hojeLocal() };

  req.dadosValidados = {
    ...req.dadosValidados,
    filtrosDisponiveis: filtros,
  };
  next();
}

export function validarIdHorario(req, _res, next) {
  req.dadosValidados = {
    ...req.dadosValidados,
    horarioId: validarId(req.params.id, "Horário"),
  };
  next();
}

export const funcionamentoHorario = {
  HORA_ABERTURA,
  HORA_FECHAMENTO,
  funcionaNaData,
  hojeLocal,
};
