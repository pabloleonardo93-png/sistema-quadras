import crypto from "node:crypto";
import { validarData } from "../../utils/validacoes.js";

export const PAGINA_RESERVA_QUADRAS = "reserva_quadras";

function limitarTexto(valor, tamanho) {
  const texto = typeof valor === "string" ? valor.trim() : "";
  return texto ? texto.slice(0, tamanho) : null;
}

function visitanteFallback(req) {
  const userAgent = req.get("user-agent") || "";
  return crypto
    .createHash("sha256")
    .update(`${req.ip || ""}:${userAgent}`)
    .digest("hex")
    .slice(0, 64);
}

export function validarRegistroAcesso(req, _res, next) {
  req.dadosValidados = {
    ...req.dadosValidados,
    relatorio: {
      pagina: limitarTexto(req.body?.pagina, 80) || PAGINA_RESERVA_QUADRAS,
      visitanteId: limitarTexto(req.body?.visitanteId, 120) || visitanteFallback(req),
      caminho: limitarTexto(req.body?.caminho, 300),
      origem: limitarTexto(req.body?.origem || req.get("referer"), 500),
      userAgent: limitarTexto(req.get("user-agent"), 500),
      enderecoIp: limitarTexto(req.ip, 80),
    },
  };
  next();
}

export function validarFiltroReservas(req, _res, next) {
  req.dadosValidados = {
    ...req.dadosValidados,
    relatorio: req.query.inicio && req.query.fim
      ? { inicio: validarData(req.query.inicio), fim: validarData(req.query.fim) }
      : {},
  };
  next();
}

export function validarFiltroAcessos(req, _res, next) {
  req.dadosValidados = {
    ...req.dadosValidados,
    relatorio: {
      pagina: limitarTexto(req.query.pagina, 80) || PAGINA_RESERVA_QUADRAS,
    },
  };
  next();
}
