import { UniqueConstraintError } from "sequelize";
import { PAGAMENTO_STATUS } from "../../shared/constants/pagamentoStatus.js";
import {
  RESERVA_STATUS,
} from "../../shared/constants/reservaStatus.js";
import {
  CLIENTE_STATUS,
  HORARIO_STATUS,
  MODALIDADE_STATUS,
  QUADRA_STATUS,
} from "../../shared/constants/statusAdministrativos.js";
import { registrarLog } from "../../services/logService.js";
import ErroDaAplicacao from "../../utils/ErroDaAplicacao.js";
import { hojeLocal, validarId } from "../../utils/validacoes.js";
import { inclusoesReserva } from "./reserva.repository.js";
import * as repository from "./reserva.repository.js";

export { inclusoesReserva };

export async function verificarHorarioDisponivel({ quadra, horario, transaction }) {
  if (!horario || horario.quadraId !== quadra.id) {
    throw new ErroDaAplicacao("O horário não pertence à quadra informada.");
  }
  if (horario.data < hojeLocal()) {
    throw new ErroDaAplicacao("Não é possível reservar uma data passada.");
  }
  if (horario.status !== HORARIO_STATUS.DISPONIVEL) {
    throw new ErroDaAplicacao("Horário não está disponível.", 409);
  }

  const reservaExistente = await repository.buscarConflitoDeReserva({
    quadraId: quadra.id,
    data: horario.data,
    horaInicio: horario.horaInicio,
    transaction,
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
  try {
    return await repository.executarEmTransacao(async (transaction) => {
      const cliente = await repository.buscarClientePorId(validarId(clienteId, "Cliente"), transaction);
      if (!cliente || cliente.status !== CLIENTE_STATUS.ATIVO) {
        throw new ErroDaAplicacao("Cliente não encontrado ou inativo.", 409);
      }

      if (!emailVerificado?.email || emailVerificado.email !== cliente.email) {
        throw new ErroDaAplicacao("Valide o e-mail da reserva antes de continuar.", 403);
      }

      const quadra = await repository.buscarQuadraPorIdComModalidades(
        validarId(quadraId, "Quadra"),
        transaction,
      );
      if (!quadra || quadra.status !== QUADRA_STATUS.ATIVA) {
        throw new ErroDaAplicacao("A quadra não existe ou não está ativa.", 409);
      }

      const modalidade = await repository.buscarModalidadePorId(
        validarId(modalidadeId, "Modalidade"),
        transaction,
      );
      if (!modalidade || modalidade.status !== MODALIDADE_STATUS.ATIVA) {
        throw new ErroDaAplicacao("Modalidade não encontrada ou inativa.", 409);
      }
      if (!quadra.modalidades.some((item) => item.id === modalidade.id)) {
        throw new ErroDaAplicacao("A modalidade não é permitida nessa quadra.", 409);
      }

      const horario = await repository.buscarHorarioPorIdParaReserva(
        validarId(horarioId, "Horário"),
        transaction,
      );
      await verificarHorarioDisponivel({ quadra, horario, transaction });

      const reserva = await repository.criarReserva({
        clienteId: cliente.id,
        emailVerificacaoId: emailVerificado.verificacaoId,
        quadraId: quadra.id,
        modalidadeId: modalidade.id,
        horarioId: horario.id,
        data: horario.data,
        horaInicio: horario.horaInicio,
        horaFim: horario.horaFim,
        status: RESERVA_STATUS.AGUARDANDO_PAGAMENTO,
        valorTotal: Number(quadra.valorHora || 0),
        pagamentoStatus: PAGAMENTO_STATUS.PENDENTE,
        observacoes: typeof observacoes === "string" ? observacoes.trim() || null : null,
      }, transaction);

      if (!cliente.emailVerificadoEm || cliente.emailVerificadoEm < emailVerificado.validadoEm) {
        await repository.atualizarCliente(
          cliente,
          { emailVerificadoEm: emailVerificado.validadoEm },
          transaction,
        );
      }

      await repository.atualizarHorario(horario, { status: HORARIO_STATUS.RESERVADO }, transaction);
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
      return repository.buscarReservaDetalhadaPorId(reserva.id, transaction);
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
  return repository.executarEmTransacao(async (transaction) => {
    const reserva = await repository.buscarReservaPorId(validarId(id, "Reserva"), { transaction, lock: true });
    if (!reserva) throw new ErroDaAplicacao("Reserva não encontrada.", 404);
    if (!statusEsperados.includes(reserva.status)) {
      throw new ErroDaAplicacao(`A reserva ${reserva.status} não pode mudar para ${novoStatus}.`, 409);
    }

    const statusAnterior = reserva.status;
    const atualizacao = { status: novoStatus };
    if (novoStatus === RESERVA_STATUS.CONFIRMADA && reserva.pagamentoStatus !== PAGAMENTO_STATUS.APROVADO) {
      throw new ErroDaAplicacao("A reserva so pode ser confirmada apos pagamento aprovado.", 409);
    }
    if (novoStatus === RESERVA_STATUS.CANCELADA && reserva.pagamentoStatus !== PAGAMENTO_STATUS.APROVADO) {
      atualizacao.pagamentoStatus = PAGAMENTO_STATUS.CANCELADO;
    }
    await repository.atualizarReserva(reserva, atualizacao, transaction);
    if (novoStatus === RESERVA_STATUS.CANCELADA || novoStatus === RESERVA_STATUS.EXPIRADA) {
      await repository.atualizarHorarioStatus(reserva.horarioId, HORARIO_STATUS.DISPONIVEL, transaction);
    }

    await registrarLog({
      adminId,
      acao: `reserva_${novoStatus}`,
      entidade: "reserva",
      entidadeId: reserva.id,
      enderecoIp,
      detalhes: { statusAnterior, novoStatus },
      transaction,
    });
    return repository.buscarReservaDetalhadaPorId(reserva.id, transaction);
  });
}

export function listarReservas(filtros) {
  return repository.listarReservas(filtros);
}

export async function buscarReservaPorId(id, { mensagemNaoEncontrada = "Reserva não encontrada." } = {}) {
  const reserva = await repository.buscarReservaDetalhadaPorId(validarId(id, "Reserva"));
  if (!reserva) throw new ErroDaAplicacao(mensagemNaoEncontrada, 404);
  return reserva;
}
