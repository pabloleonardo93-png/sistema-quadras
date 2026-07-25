import LogSistema from "../../models/LogSistema.js";

const chavesSensiveis = new Set([
  "senha",
  "senhahash",
  "password",
  "token",
  "accesstoken",
  "refreshtoken",
  "authorization",
  "cookie",
  "secret",
  "clientsecret",
  "jwt",
]);

function chaveEhSensivel(chave) {
  const chaveNormalizada = String(chave).toLowerCase().replace(/[^a-z0-9]/g, "");
  return chavesSensiveis.has(chaveNormalizada);
}

function sanitizarDetalhes(valor, ancestrais = new WeakSet()) {
  if (!valor || typeof valor !== "object" || valor instanceof Date) return valor;
  if (ancestrais.has(valor)) return "[Circular]";

  ancestrais.add(valor);
  try {
    if (Array.isArray(valor)) {
      return valor.map((item) => sanitizarDetalhes(item, ancestrais));
    }

    const sanitizado = {};
    for (const [chave, conteudo] of Object.entries(valor)) {
      if (chaveEhSensivel(chave)) continue;
      sanitizado[chave] = sanitizarDetalhes(conteudo, ancestrais);
    }
    return sanitizado;
  } finally {
    ancestrais.delete(valor);
  }
}

function registrarFalha({ erro, acao, entidade, entidadeId }) {
  const codigo = typeof erro?.parent?.code === "string"
    ? erro.parent.code
    : typeof erro?.code === "string" ? erro.code : null;

  console.error("Falha ao registrar log de auditoria.", {
    acao,
    entidade,
    entidadeId,
    erro: typeof erro?.name === "string" ? erro.name : "Error",
    codigo,
  });
}

function criarLog(dados, transaction) {
  return LogSistema.create(dados, { transaction });
}

function criarLogComSavepoint(dados, transaction) {
  if (!transaction?.sequelize?.transaction) {
    return criarLog(dados, transaction);
  }

  return transaction.sequelize.transaction(
    { transaction },
    (savepoint) => criarLog(dados, savepoint),
  );
}

export async function registrarLog({
  adminId = null,
  acao,
  entidade = null,
  entidadeId = null,
  enderecoIp = null,
  detalhes = null,
  transaction,
  obrigatorio = false,
}) {
  const dados = {
    adminId,
    acao,
    entidade,
    entidadeId,
    enderecoIp,
    detalhes: sanitizarDetalhes(detalhes),
  };

  try {
    return obrigatorio
      ? await criarLog(dados, transaction)
      : await criarLogComSavepoint(dados, transaction);
  } catch (erro) {
    registrarFalha({ erro, acao, entidade, entidadeId });
    if (obrigatorio) throw erro;
    return null;
  }
}
