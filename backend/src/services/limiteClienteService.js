import { normalizarTelefoneBrasil } from "../utils/validacoes.js";
import { limitarOperacaoPersistente } from "./limitePersistenteService.js";

function numeroPositivo(valor, fallback) {
  const numero = Number(valor);
  return Number.isFinite(numero) && numero > 0 ? numero : fallback;
}

export async function limitarTentativasDadosCliente({ email, telefone, enderecoIp, transaction = null }) {
  return limitarOperacaoPersistente({
    operacao: "dados_cliente",
    identificadores: [
      ...(email ? [{ tipo: "email", valor: email }] : []),
      ...(telefone ? [{ tipo: "telefone", valor: normalizarTelefoneBrasil(telefone) }] : []),
      ...(enderecoIp ? [{ tipo: "ip", valor: enderecoIp }] : []),
    ],
    limite: numeroPositivo(process.env.CLIENTE_DADOS_MAX_ATTEMPTS_PER_EMAIL, 20),
    janelaMinutos: numeroPositivo(process.env.CLIENTE_DADOS_RATE_WINDOW_MINUTES, 60),
    transaction,
  });
}
