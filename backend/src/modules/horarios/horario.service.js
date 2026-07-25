import { HORARIO_STATUS, QUADRA_STATUS } from "../../shared/constants/statusAdministrativos.js";
import ErroDaAplicacao from "../../utils/ErroDaAplicacao.js";
import { registrarLog } from "../../services/logService.js";
import { funcionamentoHorario } from "./horario.validation.js";
import * as repository from "./horario.repository.js";

const { HORA_ABERTURA, HORA_FECHAMENTO, funcionaNaData, hojeLocal } = funcionamentoHorario;

export async function criarHorario({ dados, adminId, enderecoIp }) {
  const quadra = await repository.buscarQuadraPorId(dados.quadraId);
  if (!quadra || quadra.status !== QUADRA_STATUS.ATIVA) {
    throw new ErroDaAplicacao("Quadra não encontrada ou indisponível.", 409);
  }

  if (dados.data < hojeLocal()) throw new ErroDaAplicacao("Não é possível criar um horário em uma data passada.");
  if (!funcionaNaData(dados.data)) throw new ErroDaAplicacao("O funcionamento é de terça a domingo.", 409);
  if (dados.horaFim <= dados.horaInicio) throw new ErroDaAplicacao("A hora final deve ser posterior à hora inicial.");
  if (dados.horaInicio < HORA_ABERTURA || dados.horaInicio >= HORA_FECHAMENTO || dados.horaFim > HORA_FECHAMENTO) {
    throw new ErroDaAplicacao("O funcionamento é de 08:00 às 22:00.", 409);
  }

  const existente = await repository.buscarHorarioDuplicado(dados);
  if (existente) throw new ErroDaAplicacao("Já existe um horário para essa quadra nessa data e hora.", 409);

  const horario = await repository.criarHorario(dados);
  await registrarLog({
    adminId,
    acao: "horario_criado",
    entidade: "horario",
    entidadeId: horario.id,
    enderecoIp,
  });

  return horario;
}

export async function listarHorarios(filtros) {
  return repository.listarHorarios(filtros);
}

export async function listarHorariosDisponiveis(filtrosValidados) {
  const filtros = {
    ...repository.filtrosDisponibilidadeBase({
      horaAbertura: HORA_ABERTURA,
      horaFechamento: HORA_FECHAMENTO,
    }),
  };

  if (filtrosValidados.quadraId) filtros.quadraId = filtrosValidados.quadraId;
  filtros.data = filtrosValidados.data?.__hojeOuFuturo
    ? { [repository.Op.gte]: filtrosValidados.data.__hojeOuFuturo }
    : filtrosValidados.data;

  const horarios = await repository.listarHorariosDisponiveis(filtros);
  return horarios.filter((horario) => funcionaNaData(String(horario.data).slice(0, 10)));
}

export async function alterarBloqueio({ id, novoStatus, adminId, enderecoIp }) {
  const horario = await repository.buscarHorarioPorId(id);
  if (!horario) throw new ErroDaAplicacao("Horário não encontrado.", 404);

  const reservaAtiva = await repository.buscarReservaAtivaPorHorario(horario.id);
  if (reservaAtiva) throw new ErroDaAplicacao("O horário possui uma reserva ativa e não pode ser alterado.", 409);

  await repository.atualizarStatusHorario(horario, novoStatus);
  await registrarLog({
    adminId,
    acao: novoStatus === HORARIO_STATUS.BLOQUEADO ? "horario_bloqueado" : "horario_liberado",
    entidade: "horario",
    entidadeId: horario.id,
    enderecoIp,
  });

  return horario;
}
