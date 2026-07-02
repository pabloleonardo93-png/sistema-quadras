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

export async function criarPagamentoMercadoPago(dados) {
  const response = await api.post("/pagamentos/mercadopago/criar", dados);
  return response;
}

export async function criarReservaPublicaComPagamento(dados) {
  const clienteResponse = await criarCliente({
    nome: dados.nome,
    telefone: dados.telefone,
    email: dados.email,
  });

  return criarPagamentoMercadoPago({
    clienteId: clienteResponse.cliente.id,
    quadraId: dados.quadraId,
    modalidadeId: dados.modalidadeId,
    horarioId: dados.horarioId,
    observacoes: dados.observacoes,
  });
}

export async function criarPagamentoReserva(id) {
  const response = await api.post(`/reservas/${id}/pagamento`);
  return response;
}

export async function buscarStatusReserva(id) {
  const response = await api.get(`/reservas/${id}/status`);
  return response.reserva;
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
