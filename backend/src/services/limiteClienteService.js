import ErroDaAplicacao from "../utils/ErroDaAplicacao.js";
import { normalizarTelefoneBrasil } from "../utils/validacoes.js";

const janelaMinutos = Number(process.env.CLIENTE_DADOS_RATE_WINDOW_MINUTES || 60);
const maxTentativasPorEmail = Number(process.env.CLIENTE_DADOS_MAX_ATTEMPTS_PER_EMAIL || 20);
const maxTentativasPorTelefone = Number(process.env.CLIENTE_DADOS_MAX_ATTEMPTS_PER_PHONE || 10);
const maxTentativasPorIp = Number(process.env.CLIENTE_DADOS_MAX_ATTEMPTS_PER_IP || 60);
const tentativas = new Map();

function limiteValido(valor, fallback) {
  return Number.isFinite(valor) && valor > 0 ? valor : fallback;
}

function janelaMs() {
  return limiteValido(janelaMinutos, 60) * 60_000;
}

function limparExpiradas(agora) {
  for (const [chave, registro] of tentativas.entries()) {
    if (registro.expiraEm <= agora) {
      tentativas.delete(chave);
    }
  }
}

function registrarTentativa(chave, limite, mensagem, agora) {
  if (!chave) return;

  const limiteFinal = limiteValido(limite, 20);
  const existente = tentativas.get(chave);
  const registro = existente && existente.expiraEm > agora
    ? existente
    : { quantidade: 0, expiraEm: agora + janelaMs() };

  registro.quantidade += 1;
  tentativas.set(chave, registro);

  if (registro.quantidade > limiteFinal) {
    throw new ErroDaAplicacao(mensagem, 429);
  }
}

export function limitarTentativasDadosCliente({ email, telefone, enderecoIp }) {
  const agora = Date.now();
  limparExpiradas(agora);

  registrarTentativa(
    email ? `email:${email}` : "",
    maxTentativasPorEmail,
    "Muitas tentativas para este e-mail. Tente novamente mais tarde.",
    agora,
  );
  registrarTentativa(
    telefone ? `telefone:${normalizarTelefoneBrasil(telefone)}` : "",
    maxTentativasPorTelefone,
    "Muitas tentativas com este telefone. Tente novamente mais tarde.",
    agora,
  );
  registrarTentativa(
    enderecoIp ? `ip:${enderecoIp}` : "",
    maxTentativasPorIp,
    "Muitas tentativas deste acesso. Tente novamente mais tarde.",
    agora,
  );
}
