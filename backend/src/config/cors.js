import ErroDaAplicacao from "../utils/ErroDaAplicacao.js";

const origensLocais = ["http://localhost:5173", "http://localhost:8080"];

function separarLista(valor) {
  return String(valor || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

export function normalizarOrigem(origem) {
  if (!origem || origem === "*") return origem;

  try {
    return new URL(origem).origin;
  } catch {
    return "";
  }
}

export function montarOrigensPermitidas(env = process.env) {
  return new Set([
    ...separarLista(env.CORS_ORIGIN),
    ...separarLista(env.APP_PUBLIC_URL),
    ...separarLista(env.API_PUBLIC_URL),
    ...origensLocais,
  ].map(normalizarOrigem).filter(Boolean));
}

const origensPermitidas = montarOrigensPermitidas();

export function origemEstaPermitida({ origem, host, permitidas = origensPermitidas }) {
  if (!origem) return true;
  if (permitidas.has("*")) return true;

  const origemNormalizada = normalizarOrigem(origem);
  if (!origemNormalizada) return false;
  if (permitidas.has(origemNormalizada)) return true;

  try {
    return Boolean(host) && new URL(origemNormalizada).host === host;
  } catch {
    return false;
  }
}

export function criarCorsOptions(req) {
  return {
    credentials: true,
    origin(origem, callback) {
      if (origemEstaPermitida({ origem, host: req.get("host") })) {
        return callback(null, true);
      }

      return callback(new ErroDaAplicacao("Origem nao permitida pelo CORS.", 403));
    },
  };
}
