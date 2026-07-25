import { Op } from "sequelize";
import VerificacaoEmail from "../../models/VerificacaoEmail.js";
import { VERIFICACAO_EMAIL_STATUS } from "../../shared/constants/verificacaoEmailStatus.js";

export function expirarPendentesVencidas({ email, agora }) {
  return VerificacaoEmail.update(
    { status: VERIFICACAO_EMAIL_STATUS.EXPIRADO },
    {
      where: {
        email,
        status: VERIFICACAO_EMAIL_STATUS.PENDENTE,
        expiraEm: { [Op.lte]: agora },
      },
    },
  );
}

export function buscarUltimaPorEmail(email) {
  return VerificacaoEmail.findOne({
    where: { email },
    order: [["criadoEm", "DESC"]],
  });
}

export function contarEnviosPorEmail({ email, inicioJanela }) {
  return VerificacaoEmail.count({
    where: { email, criadoEm: { [Op.gte]: inicioJanela } },
  });
}

export function contarEnviosPorIp({ enderecoIp, inicioJanela }) {
  return VerificacaoEmail.count({
    where: { enderecoIp, criadoEm: { [Op.gte]: inicioJanela } },
  });
}

export function expirarPendentesPorEmail(email) {
  return VerificacaoEmail.update(
    { status: VERIFICACAO_EMAIL_STATUS.EXPIRADO },
    {
      where: {
        email,
        status: VERIFICACAO_EMAIL_STATUS.PENDENTE,
      },
    },
  );
}

export function criar(dados) {
  return VerificacaoEmail.create(dados);
}

export function buscarPendentePorEmail(email) {
  return VerificacaoEmail.findOne({
    where: { email, status: VERIFICACAO_EMAIL_STATUS.PENDENTE },
    order: [["criadoEm", "DESC"]],
  });
}

export function buscarValidadaPorToken({ email, tokenHash, verificacaoId, agora, transaction, lock }) {
  return VerificacaoEmail.findOne({
    where: {
      email,
      tokenHash,
      status: VERIFICACAO_EMAIL_STATUS.VALIDADO,
      tokenExpiraEm: { [Op.gt]: agora },
      id: verificacaoId,
    },
    transaction,
    lock: lock && transaction ? transaction.LOCK.UPDATE : undefined,
  });
}
