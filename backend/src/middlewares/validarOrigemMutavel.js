import { origemEstaPermitida } from "../config/cors.js";
import ErroDaAplicacao from "../utils/ErroDaAplicacao.js";

const metodosMutaveis = new Set(["POST", "PUT", "PATCH", "DELETE"]);

export default function validarOrigemMutavel(req, _res, next) {
  if (!metodosMutaveis.has(req.method)) return next();

  const origem = req.get("origin");
  if (!origem) {
    if (process.env.NODE_ENV === "production") {
      return next(new ErroDaAplicacao("Origem da requisicao nao permitida.", 403));
    }
    return next();
  }

  if (!origemEstaPermitida({ origem, host: req.get("host") })) {
    return next(new ErroDaAplicacao("Origem da requisicao nao permitida.", 403));
  }
  return next();
}
