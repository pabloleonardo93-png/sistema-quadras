import api from "../api/api";
import { obterTokenVerificacaoEmail } from "./emailVerificationService";

function headersDeVerificacaoEmail() {
  const token = obterTokenVerificacaoEmail();
  return token ? { "X-Email-Verification-Token": token } : {};
}

export async function buscarMeuCliente() {
  const response = await api.get("/clientes/me", undefined, {
    headers: headersDeVerificacaoEmail(),
  });
  return response.cliente || null;
}

export async function criarCliente(dados) {
  const response = await api.post("/clientes", dados, {
    headers: headersDeVerificacaoEmail(),
  });
  return response;
}

export async function listarClientes(params) {
  const response = await api.get("/clientes", params);
  return response.clientes || [];
}

export async function buscarCliente(id) {
  const response = await api.get(`/clientes/${id}`);
  return response.cliente;
}

export async function atualizarCliente(id, dados) {
  const response = await api.put(`/clientes/${id}`, dados);
  return response;
}

export async function alterarStatusCliente(id, status) {
  const response = await api.patch(`/clientes/${id}/status`, { status });
  return response;
}
