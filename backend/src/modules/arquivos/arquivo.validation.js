import { validarId, validarTexto } from "../../utils/validacoes.js";

export function validarMetadadosArquivo(req, _res, next) {
  if (!req.file) {
    req.dadosValidados = {
      ...req.dadosValidados,
      arquivo: {
        ...req.dadosValidados?.arquivo,
        entidade: null,
        entidadeId: null,
      },
    };
    return next();
  }

  req.dadosValidados = {
    ...req.dadosValidados,
    arquivo: {
      ...req.dadosValidados?.arquivo,
      entidade: req.body.entidade ? validarTexto(req.body.entidade, "Entidade", 80) : null,
      entidadeId: req.body.entidadeId ? validarId(req.body.entidadeId, "Entidade") : null,
    },
  };
  next();
}

export function validarIdArquivo(req, _res, next) {
  req.dadosValidados = {
    ...req.dadosValidados,
    arquivo: {
      ...req.dadosValidados?.arquivo,
      id: validarId(req.params.id, "Arquivo"),
    },
  };
  next();
}
