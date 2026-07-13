import assert from "node:assert/strict";
import test from "node:test";
import {
  montarPayloadTemplateVerificacao,
  tratarResultadoResend,
  validarConfiguracaoResend,
} from "../src/services/resendService.js";
import { gerarCodigoVerificacao } from "../src/services/verificacaoEmailService.js";
import ErroDaAplicacao from "../src/utils/ErroDaAplicacao.js";

test("monta payload de template do Resend sem html ou texto manual", () => {
  const payload = montarPayloadTemplateVerificacao({
    email: "cliente@teste.com",
    codigo: "004821",
    remetente: "Pe na Areia <reservas@example.com>",
    templateId: "template-id",
  });

  assert.deepEqual(payload, {
    from: "Pe na Areia <reservas@example.com>",
    to: ["cliente@teste.com"],
    template: {
      id: "template-id",
      variables: {
        codigo: "004821",
      },
    },
  });
  assert.equal("html" in payload, false);
  assert.equal("text" in payload, false);
});

test("exige dados minimos para montar payload de template", () => {
  assert.throws(
    () =>
      montarPayloadTemplateVerificacao({
        email: "",
        codigo: "123456",
        remetente: "Pe na Areia <reservas@example.com>",
        templateId: "template-id",
      }),
    ErroDaAplicacao,
  );

  assert.throws(
    () =>
      montarPayloadTemplateVerificacao({
        email: "cliente@teste.com",
        codigo: "",
        remetente: "Pe na Areia <reservas@example.com>",
        templateId: "template-id",
      }),
    ErroDaAplicacao,
  );
});

test("valida configuracao necessaria para envio pelo Resend", () => {
  const configuracao = validarConfiguracaoResend({
    apiKey: "re_teste",
    remetente: "Pe na Areia <reservas@example.com>",
    templateId: "template-id",
  });

  assert.equal(configuracao.apiKey, "re_teste");
  assert.equal(configuracao.remetente, "Pe na Areia <reservas@example.com>");
  assert.equal(configuracao.templateId, "template-id");

  assert.throws(
    () =>
      validarConfiguracaoResend({
        apiKey: "",
        remetente: "Pe na Areia <reservas@example.com>",
        templateId: "template-id",
      }),
    ErroDaAplicacao,
  );
  assert.throws(
    () =>
      validarConfiguracaoResend({
        apiKey: "re_teste",
        remetente: "Pe na Areia <reservas@example.com>",
        templateId: "",
      }),
    ErroDaAplicacao,
  );
});

test("trata resposta de sucesso e erro do Resend sem expor detalhes internos", () => {
  assert.deepEqual(
    tratarResultadoResend({ data: { id: "email-id" }, error: null }),
    { id: "email-id" },
  );

  assert.throws(
    () =>
      tratarResultadoResend({
        data: null,
        error: { name: "validation_error", message: "detalhe interno" },
      }),
    /Nao foi possivel enviar o codigo de verificacao/,
  );
});

test("gera codigo numerico aleatorio de seis digitos", () => {
  for (let indice = 0; indice < 50; indice += 1) {
    const codigo = gerarCodigoVerificacao();
    assert.match(codigo, /^\d{6}$/);
  }
});
