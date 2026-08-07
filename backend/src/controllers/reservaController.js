import Reserva from "../models/Reserva.js";
import { anexarExpiracaoPagamento } from "../services/mercadoPagoService.js";
import {
  alterarStatusDaReserva,
  atualizarDadosDaMinhaReserva,
  cancelarMinhaReserva,
  criarReserva,
  inclusoesReserva,
  listarMinhasReservas,
  obterMinhaReserva,
} from "../services/reservaService.js";
import ErroDaAplicacao from "../utils/ErroDaAplicacao.js";
import executarAssincrono from "../utils/executarAssincrono.js";
import { validarData, validarId, validarStatus } from "../utils/validacoes.js";

export const criar = executarAssincrono(async (req, res) => {
  const reserva = await criarReserva({
    clienteId: req.body.clienteId,
    quadraId: req.body.quadraId,
    modalidadeId: req.body.modalidadeId,
    horarioId: req.body.horarioId,
    observacoes: req.body.observacoes,
    emailVerificado: req.emailVerificado,
    enderecoIp: req.ip,
  });
  res.status(201).json({ mensagem: "Reserva criada com sucesso.", reserva });
});

export const listar = executarAssincrono(async (req, res) => {
  const where = {};
  if (req.query.status) {
    where.status = validarStatus(req.query.status, [
      "aguardando_pagamento",
      "confirmada",
      "cancelada",
      "expirada",
      "finalizada",
    ]);
  }
  if (req.query.data) where.data = validarData(req.query.data);
  if (req.query.quadraId) where.quadraId = validarId(req.query.quadraId, "Quadra");
  const reservas = await Reserva.findAll({
    where,
    include: inclusoesReserva,
    order: [["data", "DESC"], ["horaInicio", "DESC"]],
  });
  res.json({ reservas });
});

export const statusPublico = executarAssincrono(async (req, res) => {
  const reserva = await Reserva.findByPk(validarId(req.params.id, "Reserva"), {
    include: inclusoesReserva,
  });
  if (!reserva || reserva.cliente?.email !== req.emailVerificado.email) {
    throw new ErroDaAplicacao("Reserva nao encontrada.", 404);
  }
  res.json({
    reserva: {
      id: reserva.id,
      status: reserva.status,
      pagamentoStatus: reserva.pagamentoStatus,
      valorTotal: reserva.valorTotal,
      data: reserva.data,
      horaInicio: reserva.horaInicio,
      horaFim: reserva.horaFim,
      quadra: reserva.quadra ? { id: reserva.quadra.id, nome: reserva.quadra.nome } : null,
      modalidade: reserva.modalidade ? { id: reserva.modalidade.id, nome: reserva.modalidade.nome } : null,
      ...anexarExpiracaoPagamento(reserva),
    },
  });
});

export const listarMinhas = executarAssincrono(async (req, res) => {
  const reservas = await listarMinhasReservas({ email: req.emailVerificado.email });
  res.json({ reservas });
});

export const buscarMinhaPorId = executarAssincrono(async (req, res) => {
  const reserva = await obterMinhaReserva({
    id: req.params.id,
    email: req.emailVerificado.email,
  });
  res.json({ reserva });
});

export const cancelarMinha = executarAssincrono(async (req, res) => {
  const reserva = await cancelarMinhaReserva({
    id: req.params.id,
    emailVerificado: req.emailVerificado.email,
    enderecoIp: req.ip,
  });
  res.json({ mensagem: "Reserva cancelada com sucesso.", reserva });
});

export const atualizarMeusDados = executarAssincrono(async (req, res) => {
  const cliente = await atualizarDadosDaMinhaReserva({
    id: req.params.id,
    emailVerificado: req.emailVerificado.email,
    nome: req.body.nome,
    telefone: req.body.telefone,
    enderecoIp: req.ip,
  });
  res.json({ mensagem: "Dados atualizados com sucesso.", cliente });
});

export const buscarPorId = executarAssincrono(async (req, res) => {
  const reserva = await Reserva.findByPk(validarId(req.params.id, "Reserva"), {
    include: inclusoesReserva,
  });
  if (!reserva) throw new ErroDaAplicacao("Reserva não encontrada.", 404);
  res.json({ reserva });
});

function mudarStatus(req, res, statusEsperados, novoStatus, mensagem) {
  return alterarStatusDaReserva({
    id: req.params.id,
    statusEsperados,
    novoStatus,
    adminId: req.admin.id,
    enderecoIp: req.ip,
  }).then((reserva) => res.json({ mensagem, reserva }));
}

export const confirmar = executarAssincrono(async (req, res) => {
  await mudarStatus(req, res, ["aguardando_pagamento"], "confirmada", "Reserva confirmada com sucesso.");
});
export const cancelar = executarAssincrono(async (req, res) => {
  await mudarStatus(req, res, ["aguardando_pagamento", "confirmada"], "cancelada", "Reserva cancelada com sucesso.");
});
export const finalizar = executarAssincrono(async (req, res) => {
  await mudarStatus(req, res, ["confirmada"], "finalizada", "Reserva finalizada com sucesso.");
});
