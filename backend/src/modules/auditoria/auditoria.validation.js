import { validarId } from "../../utils/validacoes.js";

export function validarListagemLogs(req, _res, next) {
  const limite = Math.min(Math.max(Number(req.query.limite) || 50, 1), 100);
  const pagina = Math.max(Number(req.query.pagina) || 1, 1);

  req.dadosValidados = {
    ...req.dadosValidados,
    auditoria: {
      ...req.dadosValidados?.auditoria,
      limite,
      pagina,
    },
  };
  next();
}

export function validarIdLog(req, _res, next) {
  req.dadosValidados = {
    ...req.dadosValidados,
    auditoria: {
      ...req.dadosValidados?.auditoria,
      id: validarId(req.params.id, "Log"),
    },
  };
  next();
}
