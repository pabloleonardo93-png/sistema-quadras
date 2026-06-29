const API_BASE_URL = (
  import.meta.env.VITE_API_URL || "/api"
).replace(/\/$/, "");

export class ApiError extends Error {
  constructor(message, status, data) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.data = data;
  }
}

function getToken() {
  return localStorage.getItem("token");
}

function buildUrl(path, params) {
  const endpoint = `${API_BASE_URL}${path.startsWith("/") ? path : `/${path}`}`;
  const url = API_BASE_URL.startsWith("http")
    ? new URL(endpoint)
    : new URL(endpoint, window.location.origin);

  Object.entries(params || {}).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      url.searchParams.set(key, value);
    }
  });
  return url.toString();
}

async function request(path, options = {}) {
  const { body, headers, params, ...rest } = options;
  const token = getToken();
  const response = await fetch(buildUrl(path, params), {
    ...rest,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  const text = await response.text();
  let data = null;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      throw new ApiError("A API retornou uma resposta invalida.", response.status, text);
    }
  }

  if (!response.ok) {
    throw new ApiError(
      data?.mensagem || "Erro ao conectar com a API. Tente novamente.",
      response.status,
      data,
    );
  }

  return data;
}

const api = {
  get(path, params) {
    return request(path, { method: "GET", params });
  },
  post(path, body) {
    return request(path, { method: "POST", body });
  },
  put(path, body) {
    return request(path, { method: "PUT", body });
  },
  patch(path, body) {
    return request(path, { method: "PATCH", body });
  },
};

export { API_BASE_URL };
export default api;
