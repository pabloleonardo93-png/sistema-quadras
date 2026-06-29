import api from "../api/api";

export async function listarComunicadosPublicos() {
  const response = await api.get("/comunicados/publicos");
  return response.comunicados || [];
}

export async function listarComunicados(params) {
  const response = await api.get("/comunicados", params);
  return response.comunicados || [];
}

export async function criarComunicado(dados) {
  const response = await api.post("/comunicados", dados);
  return response;
}

export async function atualizarComunicado(id, dados) {
  const response = await api.put(`/comunicados/${id}`, dados);
  return response;
}

export async function publicarComunicado(id) {
  const response = await api.patch(`/comunicados/${id}/publicar`);
  return response;
}

export async function arquivarComunicado(id) {
  const response = await api.patch(`/comunicados/${id}/arquivar`);
  return response;
}
