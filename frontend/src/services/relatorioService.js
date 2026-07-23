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

export const PAGINAS_RELATORIO_RESERVA = {
  marcacao: "reserva_marcacao",
  dados: "reserva_dados",
  pagamento: "reserva_pagamento",
  pagamentoGerado: "pagamento_gerado",
};

export async function buscarRelatorioAcessos(pagina = "reserva_quadras") {
  return api.get("/relatorios/acessos", { pagina });
}

export async function buscarRelatorioFunilReserva() {
  const [marcacao, dados, pagamento, pagamentoGerado] = await Promise.all([
    buscarRelatorioAcessos(PAGINAS_RELATORIO_RESERVA.marcacao),
    buscarRelatorioAcessos(PAGINAS_RELATORIO_RESERVA.dados),
    buscarRelatorioAcessos(PAGINAS_RELATORIO_RESERVA.pagamento),
    buscarRelatorioAcessos(PAGINAS_RELATORIO_RESERVA.pagamentoGerado),
  ]);

  return {
    marcacao,
    dados,
    pagamento,
    pagamentoGerado,
  };
}
