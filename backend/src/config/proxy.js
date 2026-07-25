import "./env.js";

const TRUST_PROXY_HOPS_PADRAO = 0;
const TRUST_PROXY_HOPS_MAXIMO = 5;

export function normalizarTrustProxyHops(valor) {
  if (valor === undefined || valor === null || String(valor).trim() === "") {
    return TRUST_PROXY_HOPS_PADRAO;
  }

  const texto = String(valor).trim();
  if (!/^\d+$/.test(texto)) {
    return TRUST_PROXY_HOPS_PADRAO;
  }

  const hops = Number(texto);
  if (!Number.isSafeInteger(hops) || hops < 0 || hops > TRUST_PROXY_HOPS_MAXIMO) {
    return TRUST_PROXY_HOPS_PADRAO;
  }

  return hops;
}

export const trustProxyHops = normalizarTrustProxyHops(process.env.TRUST_PROXY_HOPS);
