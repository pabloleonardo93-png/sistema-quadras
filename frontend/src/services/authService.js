import api from "../api/api";

const TOKEN_KEY = "token";
const ADMIN_KEY = "administrador";

export async function login(dados) {
  const response = await api.post("/auth/login", dados);

  if (response.token) {
    localStorage.setItem(TOKEN_KEY, response.token);
  }

  if (response.administrador) {
    localStorage.setItem(ADMIN_KEY, JSON.stringify(response.administrador));
  }

  return response;
}

export async function buscarAdministradorAtual() {
  const response = await api.get("/auth/me");
  if (response.administrador) {
    localStorage.setItem(ADMIN_KEY, JSON.stringify(response.administrador));
  }
  return response.administrador;
}

export function logout() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(ADMIN_KEY);
}

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function getAdmin() {
  try {
    return JSON.parse(localStorage.getItem(ADMIN_KEY) || "null");
  } catch {
    return null;
  }
}

export function isAuthenticated() {
  return Boolean(getToken());
}
