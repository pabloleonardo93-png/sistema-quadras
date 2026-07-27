import assert from "node:assert/strict";
import test from "node:test";
import { mascararEmail, mascararTelefone } from "../src/utils/privacidade.js";

test("mascara e-mail para exibicao informativa", () => {
  assert.equal(mascararEmail("pabloleonardo@gmail.com"), "pab**********@gmail.com");
  assert.equal(mascararEmail("invalido"), "");
});

test("mascara telefone para exibicao informativa", () => {
  assert.equal(mascararTelefone("(51) 99999-5959"), "(51) 9****-5959");
  assert.equal(mascararTelefone("123"), "");
});
