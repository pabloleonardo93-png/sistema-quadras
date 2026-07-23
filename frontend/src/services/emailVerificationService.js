import api from "../api/api";

const EMAIL_VERIFICATION_TOKEN_KEY = "peNaAreiaEmailVerificationToken";

function obterTokenSalvo() {
  try {
    return localStorage.getItem(EMAIL_VERIFICATION_TOKEN_KEY) || "";
  } catch {
    return "";
  }
}

export function obterTokenVerificacaoEmail() {
  return obterTokenSalvo();
}

function salvarToken(token) {
  if (!token) return;
  try {
    localStorage.setItem(EMAIL_VERIFICATION_TOKEN_KEY, token);
  } catch {
    // O cookie HttpOnly continua sendo a fonte principal da sessao.
  }
}

export function limparSessaoEmailSalva() {
  try {
    localStorage.removeItem(EMAIL_VERIFICATION_TOKEN_KEY);
  } catch {
    // Sem acao: alguns navegadores podem bloquear armazenamento local.
  }
}

export async function buscarSessaoEmail() {
  const token = obterTokenSalvo();
  const sessao = await api.get("/verificacao-email/sessao", undefined, {
    auth: false,
    headers: token ? { "X-Email-Verification-Token": token } : {},
  });

  if (!sessao?.verificado) {
    limparSessaoEmailSalva();
  }

  return sessao;
}

export async function solicitarCodigoEmail(email) {
  return api.post("/verificacao-email/enviar", { email }, { auth: false });
}

export async function confirmarCodigoEmail(email, codigo) {
  const response = await api.post(
    "/verificacao-email/confirmar",
    { email, codigo },
    { auth: false },
  );
  salvarToken(response?.token);
  return response;
}
