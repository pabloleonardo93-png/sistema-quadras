import { RESERVA_STATUS_LISTA } from "../../shared/constants/reservaStatus.js";
import { validarData, validarId, validarStatus } from "../../utils/validacoes.js";

export function prepararCriacaoReserva(req, _res, next) {
  req.dadosValidados = {
    ...req.dadosValidados,
    reserva: {
      clienteId: req.body.clienteId,
      quadraId: req.body.quadraId,
      modalidadeId: req.body.modalidadeId,
      horarioId: req.body.horarioId,
      observacoes: req.body.observacoes,
    },
  };
  next();
}

export function validarListagemReservas(req, _res, next) {
  const filtros = {};
  if (req.query.status) filtros.status = validarStatus(req.query.status, RESERVA_STATUS_LISTA);
  if (req.query.data) filtros.data = validarData(req.query.data);
  if (req.query.quadraId) filtros.quadraId = validarId(req.query.quadraId, "Quadra");

  req.dadosValidados = {
    ...req.dadosValidados,
    filtrosReservas: filtros,
  };
  next();
}

export function validarIdReserva(req, _res, next) {
  req.dadosValidados = {
    ...req.dadosValidados,
    reservaId: validarId(req.params.id, "Reserva"),
  };
  next();
}
