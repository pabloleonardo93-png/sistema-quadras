import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const raiz = new URL("../", import.meta.url);

async function ler(caminho) {
  return readFile(new URL(caminho, raiz), "utf8");
}

test("o backend usa apenas cookie HttpOnly para a sessao de e-mail", async () => {
  const extrator = await ler("src/utils/emailVerificationToken.js");
  const controller = await ler("src/controllers/verificacaoEmailController.js");
  assert.doesNotMatch(extrator, /x-email-verification-token|emailVerificationToken/);
  assert.doesNotMatch(controller, /token:\s*resultado\.token/);
  assert.match(controller, /httpOnly:\s*true|opcoesCookieVerificacao/);
  assert.match(controller, /encerrarSessao/);
});

test("o frontend limpa token legado e nao envia token de verificacao", async () => {
  const servicoEmail = await ler("../frontend/src/services/emailVerificationService.js");
  const servicoReserva = await ler("../frontend/src/services/reservaService.js");
  assert.match(servicoEmail, /localStorage\.removeItem/);
  assert.doesNotMatch(servicoEmail, /localStorage\.setItem/);
  assert.doesNotMatch(servicoReserva, /X-Email-Verification-Token|emailVerificationToken/);
});

test("rotas de pagamento e status exigem sessao verificada", async () => {
  const rotas = await ler("src/routes/reservaRoutes.js");
  assert.match(rotas, /router\.post\("\/:id\/pagamento", validarEmailVerificado/);
  assert.match(rotas, /router\.get\("\/:id\/status", validarEmailVerificado/);
});
