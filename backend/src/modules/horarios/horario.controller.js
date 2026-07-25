import { HORARIO_STATUS } from "../../shared/constants/statusAdministrativos.js";
import executarAssincrono from "../../utils/executarAssincrono.js";
import * as horarioService from "./horario.service.js";

export const criar = executarAssincrono(async (req, res) => {
  const horario = await horarioService.criarHorario({
    dados: req.dadosValidados.horario,
    adminId: req.admin.id,
    enderecoIp: req.ip,
  });

  res.status(201).json({ mensagem: "Horário criado com sucesso.", horario });
});

export const listar = executarAssincrono(async (req, res) => {
  const horarios = await horarioService.listarHorarios(req.dadosValidados.filtrosHorarios);
  res.json({ horarios });
});

export const listarDisponiveis = executarAssincrono(async (req, res) => {
  const horarios = await horarioService.listarHorariosDisponiveis(req.dadosValidados.filtrosDisponiveis);
  res.json({ horarios });
});

async function alterarBloqueio(req, res, novoStatus) {
  const horario = await horarioService.alterarBloqueio({
    id: req.dadosValidados.horarioId,
    novoStatus,
    adminId: req.admin.id,
    enderecoIp: req.ip,
  });

  res.json({
    mensagem: novoStatus === HORARIO_STATUS.BLOQUEADO ? "Horário bloqueado com sucesso." : "Horário liberado com sucesso.",
    horario,
  });
}

export const bloquear = executarAssincrono(async (req, res) => alterarBloqueio(req, res, HORARIO_STATUS.BLOQUEADO));
export const liberar = executarAssincrono(async (req, res) => alterarBloqueio(req, res, HORARIO_STATUS.DISPONIVEL));
