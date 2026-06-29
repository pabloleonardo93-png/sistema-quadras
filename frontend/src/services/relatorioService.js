import api from "../api/api";

export async function buscarDashboard() {
  return api.get("/relatorios/dashboard");
}

export async function buscarRelatorioReservas(params) {
  return api.get("/relatorios/reservas", params);
}

export async function buscarRelatorioOcupacao() {
  return api.get("/relatorios/ocupacao");
}

export async function buscarRelatorioModalidades() {
  return api.get("/relatorios/modalidades");
}
