import { Op, UniqueConstraintError } from "sequelize";
import sequelize from "../config/database.js";
import Cliente from "../models/Cliente.js";
import Horario from "../models/Horario.js";
import Modalidade from "../models/Modalidade.js";
import Quadra from "../models/Quadra.js";
import Reserva from "../models/Reserva.js";
import ErroDaAplicacao from "../utils/ErroDaAplicacao.js";
import {
  hojeLocal,
  validarEmail,
  validarId,
  validarTelefoneBrasil,
  validarTexto,
} from "../utils/validacoes.js";
import { registrarLog } from "./logService.js";
import { limitarOperacaoPersistente, OPERACOES_LIMITE } from "./limitePersistenteService.js";
import { calcularPagamentoExpiraEm } from "../config/pagamento.js";
import { limitarTentativasDadosCliente } from "./limiteClienteService.js";

export const inclusoesReserva = [
  { model: Cliente, as: "cliente" },
  { model: Quadra, as: "quadra" },
  { model: Modalidade, as: "modalidade" },
  { model: Horario, as: "horario" },
];

export function dadosPagamentoInicial(agora = new Date()) {
  const pagamentoCriadoEm = agora instanceof Date ? agora : new Date(agora);
  return {
    pagamentoCriadoEm,
    pagamentoExpiraEm: calcularPagamentoExpiraEm(pagamentoCriadoEm),
  };
}

function inclusoesReservasDoEmail(email) {
  return [
    {
      model: Cliente,
      as: "cliente",
      where: { email: validarEmail(email) },
      required: true,
    },
    ...inclusoesReserva.slice(1),
  ];
}

function prazoPagamento(reserva) {
  return reserva.pagamentoExpiraEm || calcularPagamentoExpiraEm(reserva.pagamentoCriadoEm);
}

export function dadosMinhaReserva(reserva, { detalhes = false, agora = new Date() } = {}) {
  const pagamentoExpiraEm = prazoPagamento(reserva);
  const aguardandoPagamento = reserva.status === "aguardando_pagamento"
    && reserva.pagamentoStatus === "pendente";
  const pagamentoNoPrazo = aguardandoPagamento
    && pagamentoExpiraEm
    && pagamentoExpiraEm > agora;
  const formaPagamento = reserva.pagamentoTipo === "checkout"
    ? "cartao"
    : reserva.pagamentoTipo === "pix"
      ? "pix"
      : null;
  const possuiPagamentoContinuavel = formaPagamento === "pix"
    ? Boolean(reserva.pixCopiaECola || reserva.pixQrCodeBase64 || reserva.pagamentoUrl)
    : formaPagamento === "cartao"
      ? Boolean(reserva.pagamentoUrl)
      : false;
  const podeContinuarPagamento = Boolean(pagamentoNoPrazo && possuiPagamentoContinuavel);

  const pagamento = {
    status: reserva.pagamentoStatus,
    forma: formaPagamento,
    expiraEm: pagamentoExpiraEm?.toISOString() || null,
    podeContinuar: podeContinuarPagamento,
  };

  if (detalhes && podeContinuarPagamento && formaPagamento === "pix") {
    pagamento.pix = {
      qrCode: reserva.pixCopiaECola || null,
      qrCodeBase64: reserva.pixQrCodeBase64 || null,
      ticketUrl: reserva.pagamentoUrl || null,
    };
  }
  if (detalhes && podeContinuarPagamento && formaPagamento === "cartao") {
    pagamento.checkoutUrl = reserva.pagamentoUrl;
  }

  return {
    id: reserva.id,
    cliente: reserva.cliente ? {
      nome: reserva.cliente.nome,
      telefone: reserva.cliente.telefone,
      email: reserva.cliente.email,
    } : null,
    quadra: reserva.quadra ? { id: reserva.quadra.id, nome: reserva.quadra.nome } : null,
    modalidade: reserva.modalidade ? { id: reserva.modalidade.id, nome: reserva.modalidade.nome } : null,
    data: reserva.data,
    horaInicio: reserva.horaInicio,
    horaFim: reserva.horaFim,
    valorTotal: reserva.valorTotal,
    status: reserva.status,
    pagamento,
    observacoes: detalhes ? reserva.observacoes : undefined,
    acoes: {
      podeContinuarPagamento,
      podeCancelar: reserva.status === "aguardando_pagamento"
        && reserva.pagamentoStatus !== "aprovado",
      podeEditarDados: Boolean(reserva.cliente),
    },
  };
}

export async function listarMinhasReservas({ email }) {
  const reservas = await Reserva.findAll({
    include: inclusoesReservasDoEmail(email),
    order: [["data", "DESC"], ["horaInicio", "DESC"]],
  });
  return reservas.map((reserva) => dadosMinhaReserva(reserva));
}

export async function buscarMinhaReserva({ id, email, transaction = null, lock = false }) {
  const reservaId = validarId(id, "Reserva");

  if (!lock) {
    const reserva = await Reserva.findOne({
      where: { id: reservaId },
      include: inclusoesReservasDoEmail(email),
      transaction,
    });
    if (!reserva) throw new ErroDaAplicacao("Reserva nao encontrada.", 404);
    return reserva;
  }

  const reserva = await Reserva.findByPk(reservaId, {
    transaction,
    lock: transaction.LOCK.UPDATE,
  });
  if (!reserva) throw new ErroDaAplicacao("Reserva nao encontrada.", 404);

  const cliente = await Cliente.findOne({
    where: { id: reserva.clienteId, email: validarEmail(email) },
    transaction,
    lock: transaction.LOCK.UPDATE,
  });
  if (!cliente) throw new ErroDaAplicacao("Reserva nao encontrada.", 404);

  reserva.cliente = cliente;
  return reserva;
}

export async function obterMinhaReserva({ id, email }) {
  const reserva = await buscarMinhaReserva({ id, email });
  return dadosMinhaReserva(reserva, { detalhes: true });
}

export async function cancelarMinhaReserva({ id, emailVerificado, enderecoIp = null }) {
  const email = validarEmail(emailVerificado);
  await limitarOperacaoPersistente({
    operacao: OPERACOES_LIMITE.RESERVA,
    identificadores: [
      { tipo: "email", valor: email },
      { tipo: "reserva", valor: id },
      ...(enderecoIp ? [{ tipo: "ip", valor: enderecoIp }] : []),
    ],
  });

  return sequelize.transaction(async (transaction) => {
    const reserva = await buscarMinhaReserva({ id, email, transaction, lock: true });
    if (reserva.status !== "aguardando_pagamento" || reserva.pagamentoStatus === "aprovado") {
      throw new ErroDaAplicacao("Essa reserva nao pode ser cancelada por este canal.", 409);
    }

    const statusAnterior = reserva.status;
    await reserva.update({ status: "cancelada", pagamentoStatus: "cancelado" }, { transaction });
    await Horario.update(
      { status: "disponivel" },
      { where: { id: reserva.horarioId }, transaction },
    );
    await registrarLog({
      acao: "reserva_cancelada",
      entidade: "reserva",
      entidadeId: reserva.id,
      enderecoIp,
      detalhes: { statusAnterior, novoStatus: "cancelada", origem: "cliente" },
      transaction,
    });

    const atualizada = await Reserva.findByPk(reserva.id, {
      include: inclusoesReserva,
      transaction,
    });
    return dadosMinhaReserva(atualizada, { detalhes: true });
  });
}

export async function atualizarDadosDaMinhaReserva({
  id,
  emailVerificado,
  nome,
  telefone,
  enderecoIp = null,
}) {
  const email = validarEmail(emailVerificado);
  const dados = {
    nome: validarTexto(nome, "Nome", 120),
    telefone: validarTelefoneBrasil(telefone),
  };
  await limitarTentativasDadosCliente({ email, telefone: dados.telefone, enderecoIp });

  return sequelize.transaction(async (transaction) => {
    const reserva = await buscarMinhaReserva({ id, email, transaction, lock: true });
    if (reserva.cliente.status !== "ativo") {
      throw new ErroDaAplicacao("Cliente encontrado, mas esta inativo.", 409);
    }

    await reserva.cliente.update(dados, { transaction });
    await registrarLog({
      acao: "cliente_atualizado_pelo_cliente",
      entidade: "cliente",
      entidadeId: reserva.cliente.id,
      enderecoIp,
      detalhes: { reservaId: reserva.id },
      transaction,
    });

    return {
      nome: reserva.cliente.nome,
      telefone: reserva.cliente.telefone,
      email: reserva.cliente.email,
    };
  });
}

export async function verificarHorarioDisponivel({ quadra, horario, transaction }) {
  if (!horario || horario.quadraId !== quadra.id) {
    throw new ErroDaAplicacao("O horário não pertence à quadra informada.");
  }
  if (horario.data < hojeLocal()) {
    throw new ErroDaAplicacao("Não é possível reservar uma data passada.");
  }
  if (horario.status !== "disponivel") {
    throw new ErroDaAplicacao("Horário não está disponível.", 409);
  }

  const reservaExistente = await Reserva.findOne({
    where: {
      quadraId: quadra.id,
      data: horario.data,
      horaInicio: horario.horaInicio,
      status: { [Op.notIn]: ["cancelada", "expirada"] },
    },
    transaction,
    lock: transaction.LOCK.UPDATE,
  });

  if (reservaExistente) {
    throw new ErroDaAplicacao("Já existe uma reserva para essa quadra nesse dia e horário.", 409);
  }
}

export async function criarReserva({
  clienteId,
  quadraId,
  modalidadeId,
  horarioId,
  observacoes,
  adminId = null,
  enderecoIp = null,
  emailVerificado = null,
}) {
  if (!adminId) {
    await limitarOperacaoPersistente({
      operacao: OPERACOES_LIMITE.RESERVA,
      identificadores: [
        ...(emailVerificado?.verificacaoId ? [{ tipo: "sessao", valor: emailVerificado.verificacaoId }] : []),
        ...(emailVerificado?.email ? [{ tipo: "email", valor: emailVerificado.email }] : []),
        ...(enderecoIp ? [{ tipo: "ip", valor: enderecoIp }] : []),
      ],
    });
  }
  try {
    return await sequelize.transaction(async (transaction) => {
      const cliente = await Cliente.findByPk(validarId(clienteId, "Cliente"), { transaction });
      if (!cliente || cliente.status !== "ativo") {
        throw new ErroDaAplicacao("Cliente não encontrado ou inativo.", 409);
      }

      if (!emailVerificado?.email || emailVerificado.email !== cliente.email) {
        throw new ErroDaAplicacao("Valide o e-mail da reserva antes de continuar.", 403);
      }

      const quadra = await Quadra.findByPk(validarId(quadraId, "Quadra"), {
        include: [{ model: Modalidade, as: "modalidades", attributes: ["id"] }],
        transaction,
      });
      if (!quadra || quadra.status !== "ativa") {
        throw new ErroDaAplicacao("A quadra não existe ou não está ativa.", 409);
      }

      const modalidade = await Modalidade.findByPk(validarId(modalidadeId, "Modalidade"), { transaction });
      if (!modalidade || modalidade.status !== "ativa") {
        throw new ErroDaAplicacao("Modalidade não encontrada ou inativa.", 409);
      }
      if (!quadra.modalidades.some((item) => item.id === modalidade.id)) {
        throw new ErroDaAplicacao("A modalidade não é permitida nessa quadra.", 409);
      }

      const horario = await Horario.findByPk(validarId(horarioId, "Horário"), {
        transaction,
        lock: transaction.LOCK.UPDATE,
      });
      await verificarHorarioDisponivel({ quadra, horario, transaction });

      const dadosPagamento = dadosPagamentoInicial();
      const reserva = await Reserva.create({
        clienteId: cliente.id,
        emailVerificacaoId: emailVerificado.verificacaoId,
        quadraId: quadra.id,
        modalidadeId: modalidade.id,
        horarioId: horario.id,
        data: horario.data,
        horaInicio: horario.horaInicio,
        horaFim: horario.horaFim,
        status: "aguardando_pagamento",
        valorTotal: Number(quadra.valorHora || 0),
        pagamentoStatus: "pendente",
        ...dadosPagamento,
        observacoes: typeof observacoes === "string" ? observacoes.trim() || null : null,
      }, { transaction });

      if (!cliente.emailVerificadoEm || cliente.emailVerificadoEm < emailVerificado.validadoEm) {
        await cliente.update({ emailVerificadoEm: emailVerificado.validadoEm }, { transaction });
      }

      await horario.update({ status: "reservado" }, { transaction });
      await registrarLog({
        adminId,
        acao: "reserva_criada",
        entidade: "reserva",
        entidadeId: reserva.id,
        enderecoIp,
        detalhes: {
          clienteId: cliente.id,
          quadraId: quadra.id,
          horarioId: horario.id,
          emailVerificacaoId: emailVerificado.verificacaoId,
        },
        transaction,
      });
      return Reserva.findByPk(reserva.id, { include: inclusoesReserva, transaction });
    });
  } catch (erro) {
    if (erro instanceof UniqueConstraintError) {
      throw new ErroDaAplicacao("Já existe uma reserva para essa quadra nesse dia e horário.", 409);
    }
    throw erro;
  }
}

export async function alterarStatusDaReserva({
  id,
  statusEsperados,
  novoStatus,
  adminId,
  enderecoIp,
}) {
  return sequelize.transaction(async (transaction) => {
    const reserva = await Reserva.findByPk(validarId(id, "Reserva"), {
      transaction,
      lock: transaction.LOCK.UPDATE,
    });
    if (!reserva) throw new ErroDaAplicacao("Reserva não encontrada.", 404);
    if (!statusEsperados.includes(reserva.status)) {
      throw new ErroDaAplicacao("A reserva " + reserva.status + " não pode mudar para " + novoStatus + ".", 409);
    }

    const statusAnterior = reserva.status;
    const atualizacao = { status: novoStatus };
    if (novoStatus === "confirmada" && reserva.pagamentoStatus !== "aprovado") {
      throw new ErroDaAplicacao("A reserva so pode ser confirmada apos pagamento aprovado.", 409);
    }
    if (novoStatus === "cancelada" && reserva.pagamentoStatus !== "aprovado") {
      atualizacao.pagamentoStatus = "cancelado";
    }
    await reserva.update(atualizacao, { transaction });
    if (novoStatus === "cancelada" || novoStatus === "expirada") {
      await Horario.update(
        { status: "disponivel" },
        { where: { id: reserva.horarioId }, transaction },
      );
    }

    await registrarLog({
      adminId,
      acao: "reserva_" + novoStatus,
      entidade: "reserva",
      entidadeId: reserva.id,
      enderecoIp,
      detalhes: { statusAnterior, novoStatus },
      transaction,
    });
    return Reserva.findByPk(reserva.id, { include: inclusoesReserva, transaction });
  });
}
