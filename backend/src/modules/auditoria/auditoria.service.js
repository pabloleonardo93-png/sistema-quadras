import ErroDaAplicacao from "../../utils/ErroDaAplicacao.js";
import * as repository from "./auditoria.repository.js";

export async function listar({ pagina, limite }) {
  const { rows: logs, count: total } = await repository.listar({
    limite,
    offset: (pagina - 1) * limite,
  });
  return { pagina, limite, total, logs };
}

export async function buscarPorId(id) {
  const log = await repository.buscarPorId(id);
  if (!log) throw new ErroDaAplicacao("Log não encontrado.", 404);
  return log;
}
