import { API_BASE_URL, ApiError } from "../api/api";

function buildUrl(path) {
  const endpoint = `${API_BASE_URL}${path.startsWith("/") ? path : `/${path}`}`;
  return API_BASE_URL.startsWith("http")
    ? endpoint
    : new URL(endpoint, window.location.origin).toString();
}

function getToken() {
  return localStorage.getItem("token");
}

export async function enviarArquivo(arquivo, dados = {}) {
  const formData = new FormData();
  formData.append("arquivo", arquivo);

  Object.entries(dados).forEach(([chave, valor]) => {
    if (valor !== undefined && valor !== null && valor !== "") {
      formData.append(chave, String(valor));
    }
  });

  const token = getToken();
  const response = await fetch(buildUrl("/arquivos/upload"), {
    method: "POST",
    credentials: "include",
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    body: formData,
  });

  const text = await response.text();
  let data = null;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      throw new ApiError("O sistema retornou uma resposta invalida.", response.status, text);
    }
  }

  if (!response.ok) {
    throw new ApiError(
      data?.mensagem || data?.erro || "Nao foi possivel enviar o arquivo.",
      response.status,
      data,
    );
  }

  return data;
}
