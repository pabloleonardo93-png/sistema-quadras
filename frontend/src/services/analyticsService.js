import api, { API_BASE_URL } from "../api/api";

const VISITOR_STORAGE_KEY = "pe_na_areia_visitante_id";
const RESERVATION_VIEW_PREFIX = "pe_na_areia_reserva_view:";

export const PAGINAS_ANALYTICS_RESERVA = {
  chamada: "reserva_quadras",
  marcacao: "reserva_marcacao",
  dados: "reserva_dados",
  pagamento: "reserva_pagamento",
  pagamentoGerado: "pagamento_gerado",
};

function criarVisitanteId() {
  if (window.crypto?.randomUUID) return window.crypto.randomUUID();
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function obterVisitanteId() {
  try {
    const atual = localStorage.getItem(VISITOR_STORAGE_KEY);
    if (atual) return atual;

    const novo = criarVisitanteId();
    localStorage.setItem(VISITOR_STORAGE_KEY, novo);
    return novo;
  } catch {
    return criarVisitanteId();
  }
}

function caminhoAtual() {
  return `${window.location.pathname}${window.location.search}`;
}

function dadosAcesso({
  caminho = caminhoAtual(),
  pagina = PAGINAS_ANALYTICS_RESERVA.chamada,
} = {}) {
  return {
    pagina,
    visitanteId: obterVisitanteId(),
    caminho,
    origem: document.referrer || "",
  };
}

function endpointAcessos() {
  const endpoint = `${API_BASE_URL}/relatorios/acessos`;
  if (API_BASE_URL.startsWith("http")) return endpoint;
  return new URL(endpoint, window.location.origin).toString();
}

export function registrarEventoAcesso(pagina, caminho) {
  const payload = JSON.stringify(dadosAcesso({ pagina, caminho }));

  if (navigator.sendBeacon) {
    const body = new Blob([payload], { type: "application/json" });
    if (navigator.sendBeacon(endpointAcessos(), body)) return;
  }

  void fetch(endpointAcessos(), {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: payload,
    keepalive: true,
  }).catch(() => null);
}

export async function registrarAcessoPagina(pagina, caminho) {
  try {
    return await api.post("/relatorios/acessos", dadosAcesso({ pagina, caminho }));
  } catch {
    return null;
  }
}

export function registrarVisualizacaoPagina(pagina, caminho) {
  const viewPath = caminho || caminhoAtual();
  const key = `${RESERVATION_VIEW_PREFIX}${pagina}:${viewPath}`;

  try {
    if (sessionStorage.getItem(key)) return;
    sessionStorage.setItem(key, "1");
  } catch {
    // Se sessionStorage estiver bloqueado, ainda tenta registrar o acesso.
  }

  void registrarAcessoPagina(pagina, viewPath);
}

export function registrarCliqueReserva(caminho) {
  registrarEventoAcesso(PAGINAS_ANALYTICS_RESERVA.chamada, caminho);
}

export async function registrarAcessoReserva(caminho) {
  return registrarAcessoPagina(PAGINAS_ANALYTICS_RESERVA.chamada, caminho);
}

export function registrarVisualizacaoReserva(caminho) {
  registrarVisualizacaoPagina(PAGINAS_ANALYTICS_RESERVA.chamada, caminho);
}

export function registrarVisualizacaoMarcacaoReserva(caminho) {
  registrarVisualizacaoPagina(PAGINAS_ANALYTICS_RESERVA.marcacao, caminho);
}

export function registrarVisualizacaoDadosReserva(caminho) {
  registrarVisualizacaoPagina(PAGINAS_ANALYTICS_RESERVA.dados, caminho);
}

export function registrarVisualizacaoPagamentoReserva(caminho) {
  registrarVisualizacaoPagina(PAGINAS_ANALYTICS_RESERVA.pagamento, caminho);
}

export function registrarPagamentoGeradoReserva(caminho) {
  registrarVisualizacaoPagina(PAGINAS_ANALYTICS_RESERVA.pagamentoGerado, caminho);
}
