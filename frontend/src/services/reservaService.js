import api from "../api/api";
import { criarCliente } from "./clienteService";

export async function listarReservas(params) {
  const response = await api.get("/reservas", params);
  return response.reservas || [];
}

export async function criarReserva(dados) {
  const response = await api.post("/reservas", dados);
  return response;
}

export async function criarReservaPublica(dados) {
  const clienteResponse = await criarCliente({
    nome: dados.nome,
    telefone: dados.telefone,
    email: dados.email,
  });

  return criarReserva({
    clienteId: clienteResponse.cliente.id,
    quadraId: dados.quadraId,
    modalidadeId: dados.modalidadeId,
    horarioId: dados.horarioId,
    observacoes: dados.observacoes,
  });
}

export async function confirmarReserva(id) {
  const response = await api.patch(`/reservas/${id}/confirmar`);
  return response;
}

export async function cancelarReserva(id) {
  const response = await api.patch(`/reservas/${id}/cancelar`);
  return response;
}

export async function finalizarReserva(id) {
  const response = await api.patch(`/reservas/${id}/finalizar`);
  return response;
}
