import api from "../api/api";

const EMAIL_VERIFICATION_TOKEN_KEY = "peNaAreiaEmailVerificationToken";

// Limpa a versao legada da sessao: a autorizacao atual existe apenas no cookie HttpOnly.
export function limparSessaoEmailSalva() {
  try {
    localStorage.removeItem(EMAIL_VERIFICATION_TOKEN_KEY);
  } catch {
    // Alguns navegadores podem bloquear armazenamento local.
  }
}

limparSessaoEmailSalva();

export async function buscarSessaoEmail() {
  const sessao = await api.get("/verificacao-email/sessao", undefined, { auth: false });
  if (!sessao?.verificado) limparSessaoEmailSalva();
  return sessao;
}

export async function solicitarCodigoEmail(email) {
  return api.post("/verificacao-email/enviar", { email }, { auth: false });
}

export async function confirmarCodigoEmail(email, codigo) {
  const response = await api.post("/verificacao-email/confirmar", { email, codigo }, { auth: false });
  limparSessaoEmailSalva();
  return response;
}

export async function encerrarSessaoEmail() {
  try {
    await api.post("/verificacao-email/encerrar", {}, { auth: false });
  } finally {
    limparSessaoEmailSalva();
  }
}
