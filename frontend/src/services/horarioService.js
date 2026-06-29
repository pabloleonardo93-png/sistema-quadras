import api from "../api/api";

export async function listarHorarios(params) {
  const response = await api.get("/horarios", params);
  return response.horarios || [];
}

export async function listarHorariosDisponiveis(params) {
  const response = await api.get("/horarios/disponiveis", params);
  return response.horarios || [];
}

export async function criarHorario(dados) {
  const response = await api.post("/horarios", dados);
  return response;
}

export async function bloquearHorario(id) {
  const response = await api.patch(`/horarios/${id}/bloquear`);
  return response;
}

export async function liberarHorario(id) {
  const response = await api.patch(`/horarios/${id}/liberar`);
  return response;
}
