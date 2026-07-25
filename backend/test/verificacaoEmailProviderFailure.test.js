import assert from "node:assert/strict";
import test from "node:test";
import VerificacaoEmail from "../src/models/VerificacaoEmail.js";
import { VERIFICACAO_EMAIL_STATUS } from "../src/shared/constants/verificacaoEmailStatus.js";
import ErroDaAplicacao from "../src/utils/ErroDaAplicacao.js";

process.env.EMAIL_VERIFICATION_PROVIDER = "provedor-invalido";

const { solicitarCodigoEmail } = await import("../src/services/verificacaoEmailService.js");

test("expira verificacao quando provider de e-mail falha", async (t) => {
  const verificacao = {
    id: 20,
    update: t.mock.fn(async () => {}),
  };
  t.mock.method(VerificacaoEmail, "update", async () => [1]);
  t.mock.method(VerificacaoEmail, "findOne", async () => null);
  t.mock.method(VerificacaoEmail, "count", async () => 0);
  t.mock.method(VerificacaoEmail, "create", async () => verificacao);

  await assert.rejects(
    () => solicitarCodigoEmail({
      email: "cliente@teste.com",
      enderecoIp: "127.0.0.1",
      userAgent: "Teste",
    }),
    (erro) => erro instanceof ErroDaAplicacao && erro.status === 503,
  );

  assert.deepEqual(verificacao.update.mock.calls[0].arguments[0], {
    status: VERIFICACAO_EMAIL_STATUS.EXPIRADO,
  });
});
