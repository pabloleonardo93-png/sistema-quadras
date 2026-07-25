import { Router } from "express";
import * as controller from "./verificacaoEmail.controller.js";
import { validarConfirmacaoCodigo, validarSolicitacaoCodigo } from "./verificacaoEmail.validation.js";

const router = Router();

router.get("/sessao", controller.obterSessao);
router.post("/enviar", validarSolicitacaoCodigo, controller.solicitarCodigo);
router.post("/confirmar", validarConfirmacaoCodigo, controller.confirmarCodigo);

export default router;
