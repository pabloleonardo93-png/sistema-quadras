import api from "../api/api";

export async function listarModalidades(params) {
  const response = await api.get("/modalidades", params);
  return response.modalidades || [];
}

export async function buscarModalidade(id) {
  const response = await api.get(`/modalidades/${id}`);
  return response.modalidade;
}

export async function criarModalidade(dados) {
  const response = await api.post("/modalidades", dados);
  return response;
}

export async function atualizarModalidade(id, dados) {
  const response = await api.put(`/modalidades/${id}`, dados);
  return response;
}

export async function alterarStatusModalidade(id, status) {
  const response = await api.patch(`/modalidades/${id}/status`, { status });
  return response;
}
