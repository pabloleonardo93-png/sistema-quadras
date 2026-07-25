import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test, { after } from "node:test";

const diretorioTemporario = await fs.mkdtemp(path.join(os.tmpdir(), "arquivos-module-"));
process.env.UPLOAD_DIR = diretorioTemporario;
process.env.UPLOAD_MAX_SIZE = "20";

const { default: express } = await import("express");
const jwt = await import("jsonwebtoken");
const { default: Admin } = await import("../src/models/Admin.js");
const { default: Arquivo } = await import("../src/models/Arquivo.js");
const { default: LogSistema } = await import("../src/models/LogSistema.js");
const arquivoService = await import("../src/modules/arquivos/arquivo.service.js");
const { default: arquivoRoutes } = await import("../src/modules/arquivos/arquivo.routes.js");
const { ADMIN_STATUS } = await import("../src/shared/constants/statusAdministrativos.js");
const { tratarErro } = await import("../src/middlewares/errorMiddleware.js");

after(async () => {
  await fs.rm(diretorioTemporario, { recursive: true, force: true });
});

function criarApp() {
  const app = express();
  app.use("/api/arquivos", arquivoRoutes);
  app.use(tratarErro);
  return app;
}

async function comServidor(callback) {
  const app = criarApp();
  const servidor = app.listen(0);
  await new Promise((resolve) => servidor.once("listening", resolve));
  const porta = servidor.address().port;
  try {
    return await callback(`http://127.0.0.1:${porta}`);
  } finally {
    await new Promise((resolve, reject) => {
      servidor.close((erro) => (erro ? reject(erro) : resolve()));
    });
  }
}

async function lerJson(resposta) {
  return {
    status: resposta.status,
    body: await resposta.json(),
  };
}

function autorizarAdmin(t) {
  const admin = { id: 1, status: ADMIN_STATUS.ATIVO };
  t.mock.method(jwt.default, "verify", () => ({ sub: String(admin.id) }));
  t.mock.method(Admin, "findByPk", async () => admin);
  return admin;
}

function formularioComArquivo({ conteudo = "%PDF-", nome = "documento.pdf", tipo = "application/pdf" } = {}) {
  const form = new FormData();
  form.append("arquivo", new Blob([conteudo], { type: tipo }), nome);
  form.append("entidade", "quadra");
  form.append("entidadeId", "1");
  return form;
}

function modeloArquivo(dados) {
  return {
    ...dados,
    toJSON() {
      const json = { ...this };
      delete json.toJSON;
      delete json.destroy;
      return json;
    },
  };
}

test("realiza upload valido", async (t) => {
  autorizarAdmin(t);
  const createMock = t.mock.method(Arquivo, "create", async (dados) =>
    modeloArquivo({
      id: 10,
      ...dados,
    }));
  const logMock = t.mock.method(LogSistema, "create", async () => ({}));

  await comServidor(async (baseUrl) => {
    const resposta = await fetch(`${baseUrl}/api/arquivos/upload`, {
      method: "POST",
      headers: { authorization: "Bearer token-valido" },
      body: formularioComArquivo(),
    });
    const { status, body } = await lerJson(resposta);

    assert.equal(status, 201);
    assert.equal(body.mensagem, "Arquivo enviado com segurança.");
    assert.equal(body.arquivo.url, "/uploads/" + body.arquivo.nomeArmazenado);
    assert.equal(createMock.mock.calls[0].arguments[0].adminId, 1);
    assert.equal(createMock.mock.calls[0].arguments[0].nomeOriginal, "documento.pdf");
    assert.equal(createMock.mock.calls[0].arguments[0].tipoMime, "application/pdf");
    assert.equal(createMock.mock.calls[0].arguments[0].caminho, createMock.mock.calls[0].arguments[0].nomeArmazenado);
    assert.equal(createMock.mock.calls[0].arguments[0].entidade, "quadra");
    assert.equal(createMock.mock.calls[0].arguments[0].entidadeId, 1);
    assert.equal(logMock.mock.calls[0].arguments[0].acao, "arquivo_enviado");
  });
});

test("rejeita upload sem arquivo", async (t) => {
  autorizarAdmin(t);
  const createMock = t.mock.method(Arquivo, "create", async () => ({}));
  const form = new FormData();
  form.append("entidade", "quadra");

  await comServidor(async (baseUrl) => {
    const resposta = await fetch(`${baseUrl}/api/arquivos/upload`, {
      method: "POST",
      headers: { authorization: "Bearer token-valido" },
      body: form,
    });
    const { status, body } = await lerJson(resposta);

    assert.equal(status, 400);
    assert.equal(body.erro, "Selecione um arquivo para enviar.");
    assert.equal(createMock.mock.calls.length, 0);
  });
});

test("rejeita tipo ou extensao de arquivo invalido", async (t) => {
  autorizarAdmin(t);
  const createMock = t.mock.method(Arquivo, "create", async () => ({}));

  await comServidor(async (baseUrl) => {
    const resposta = await fetch(`${baseUrl}/api/arquivos/upload`, {
      method: "POST",
      headers: { authorization: "Bearer token-valido" },
      body: formularioComArquivo({ conteudo: "texto", nome: "arquivo.txt", tipo: "text/plain" }),
    });
    const { status, body } = await lerJson(resposta);

    assert.equal(status, 400);
    assert.equal(body.erro, "Tipo ou extensão de arquivo não permitido.");
    assert.equal(createMock.mock.calls.length, 0);
  });
});

test("rejeita arquivo acima do limite configurado", async (t) => {
  autorizarAdmin(t);
  const createMock = t.mock.method(Arquivo, "create", async () => ({}));

  await comServidor(async (baseUrl) => {
    const resposta = await fetch(`${baseUrl}/api/arquivos/upload`, {
      method: "POST",
      headers: { authorization: "Bearer token-valido" },
      body: formularioComArquivo({ conteudo: "%PDF-" + "x".repeat(30), nome: "grande.pdf", tipo: "application/pdf" }),
    });
    const { status, body } = await lerJson(resposta);

    assert.equal(status, 400);
    assert.equal(body.erro, "O arquivo ultrapassa o tamanho máximo permitido.");
    assert.equal(createMock.mock.calls.length, 0);
  });
});

test("lista arquivos administrativos", async (t) => {
  autorizarAdmin(t);
  const arquivos = [
    modeloArquivo({ id: 20, nomeArmazenado: "arquivo.pdf", nomeOriginal: "arquivo.pdf" }),
  ];
  const findAllMock = t.mock.method(Arquivo, "findAll", async () => arquivos);

  await comServidor(async (baseUrl) => {
    const resposta = await fetch(`${baseUrl}/api/arquivos`, {
      headers: { authorization: "Bearer token-valido" },
    });
    const { status, body } = await lerJson(resposta);

    assert.equal(status, 200);
    assert.deepEqual(findAllMock.mock.calls[0].arguments[0], { order: [["criadoEm", "DESC"]] });
    assert.equal(body.arquivos[0].url, "/uploads/arquivo.pdf");
  });
});

test("remove arquivo valido", async (t) => {
  autorizarAdmin(t);
  const nomeArmazenado = "remover.pdf";
  await fs.writeFile(path.join(diretorioTemporario, nomeArmazenado), "%PDF-");
  const arquivo = modeloArquivo({
    id: 30,
    nomeArmazenado,
    destroy: t.mock.fn(async () => {}),
  });
  t.mock.method(Arquivo, "findByPk", async () => arquivo);
  const logMock = t.mock.method(LogSistema, "create", async () => ({}));

  await comServidor(async (baseUrl) => {
    const resposta = await fetch(`${baseUrl}/api/arquivos/30`, {
      method: "DELETE",
      headers: { authorization: "Bearer token-valido" },
    });
    const { status, body } = await lerJson(resposta);

    assert.equal(status, 200);
    assert.equal(body.mensagem, "Arquivo removido com sucesso.");
    await assert.rejects(fs.stat(path.join(diretorioTemporario, nomeArmazenado)));
    assert.equal(arquivo.destroy.mock.calls.length, 1);
    assert.equal(logMock.mock.calls[0].arguments[0].acao, "arquivo_removido");
  });
});

test("retorna erro quando arquivo nao existe", async (t) => {
  autorizarAdmin(t);
  t.mock.method(Arquivo, "findByPk", async () => null);

  await comServidor(async (baseUrl) => {
    const resposta = await fetch(`${baseUrl}/api/arquivos/99`, {
      method: "DELETE",
      headers: { authorization: "Bearer token-valido" },
    });
    const { status, body } = await lerJson(resposta);

    assert.equal(status, 404);
    assert.equal(body.erro, "Arquivo não encontrado.");
  });
});

test("rejeita id invalido antes de consultar arquivo", async (t) => {
  autorizarAdmin(t);
  const findByPkMock = t.mock.method(Arquivo, "findByPk", async () => ({}));

  await comServidor(async (baseUrl) => {
    const resposta = await fetch(`${baseUrl}/api/arquivos/abc`, {
      method: "DELETE",
      headers: { authorization: "Bearer token-valido" },
    });
    const { status, body } = await lerJson(resposta);

    assert.equal(status, 400);
    assert.equal(body.erro, "Arquivo inválido.");
    assert.equal(findByPkMock.mock.calls.length, 0);
  });
});

test("nega acesso sem autenticacao", async () => {
  await comServidor(async (baseUrl) => {
    const resposta = await fetch(`${baseUrl}/api/arquivos`);
    const { status, body } = await lerJson(resposta);

    assert.equal(status, 401);
    assert.equal(body.erro, "Token de autenticação não informado.");
  });
});

test("bloqueia tentativa de caminho malicioso", async (t) => {
  autorizarAdmin(t);
  const arquivo = modeloArquivo({
    id: 40,
    nomeArmazenado: "../fora.pdf",
    destroy: t.mock.fn(async () => {}),
  });
  t.mock.method(Arquivo, "findByPk", async () => arquivo);
  const logMock = t.mock.method(LogSistema, "create", async () => ({}));

  await comServidor(async (baseUrl) => {
    const resposta = await fetch(`${baseUrl}/api/arquivos/40`, {
      method: "DELETE",
      headers: { authorization: "Bearer token-valido" },
    });
    const { status, body } = await lerJson(resposta);

    assert.equal(status, 400);
    assert.equal(body.erro, "Caminho de arquivo inválido.");
    assert.equal(arquivo.destroy.mock.calls.length, 0);
    assert.equal(logMock.mock.calls.length, 0);
  });
});

test("propaga falha simulada no sistema de arquivos durante remocao", async (t) => {
  autorizarAdmin(t);
  const nomeArmazenado = "diretorio-no-lugar-do-arquivo";
  await fs.mkdir(path.join(diretorioTemporario, nomeArmazenado), { recursive: true });
  const arquivo = modeloArquivo({
    id: 50,
    nomeArmazenado,
    destroy: t.mock.fn(async () => {}),
  });
  t.mock.method(Arquivo, "findByPk", async () => arquivo);

  await comServidor(async (baseUrl) => {
    const resposta = await fetch(`${baseUrl}/api/arquivos/50`, {
      method: "DELETE",
      headers: { authorization: "Bearer token-valido" },
    });
    const { status, body } = await lerJson(resposta);

    assert.equal(status, 500);
    assert.equal(body.erro, "Erro interno do servidor.");
    assert.equal(arquivo.destroy.mock.calls.length, 0);
  });
});

test("remove arquivo fisico quando a criacao no banco falha", async (t) => {
  const caminho = path.join(diretorioTemporario, "falha-banco.pdf");
  await fs.writeFile(caminho, "%PDF-");
  t.mock.method(Arquivo, "create", async () => {
    throw new Error("falha no banco");
  });

  await assert.rejects(
    arquivoService.enviar({
      file: {
        path: caminho,
        filename: "falha-banco.pdf",
        originalname: "falha-banco.pdf",
        mimetype: "application/pdf",
        size: 5,
      },
      metadados: { entidade: null, entidadeId: null },
      adminId: 1,
      enderecoIp: "127.0.0.1",
    }),
    /falha no banco/,
  );
  await assert.rejects(fs.stat(caminho));
});
