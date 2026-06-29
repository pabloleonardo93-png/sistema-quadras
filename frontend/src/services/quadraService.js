import api from "../api/api";

export async function listarQuadras(params) {
  const response = await api.get("/quadras", params);
  return response.quadras || [];
}

export async function buscarQuadra(id) {
  const response = await api.get(`/quadras/${id}`);
  return response.quadra;
}

export async function criarQuadra(dados) {
  const response = await api.post("/quadras", dados);
  return response;
}

export async function atualizarQuadra(id, dados) {
  const response = await api.put(`/quadras/${id}`, dados);
  return response;
}

export async function alterarStatusQuadra(id, status) {
  const response = await api.patch(`/quadras/${id}/status`, { status });
  return response;
}
