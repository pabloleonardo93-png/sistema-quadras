import { Router } from "express";
import * as controller from "./verificacaoEmail.controller.js";
import {
  limitarConfirmacaoCodigoEmail,
  limitarEnvioCodigoEmail,
} from "../../middlewares/rateLimitMiddleware.js";
import { validarConfirmacaoCodigo, validarSolicitacaoCodigo } from "./verificacaoEmail.validation.js";

const router = Router();

router.get("/sessao", controller.obterSessao);
router.post("/enviar", limitarEnvioCodigoEmail, validarSolicitacaoCodigo, controller.solicitarCodigo);
router.post("/confirmar", limitarConfirmacaoCodigoEmail, validarConfirmacaoCodigo, controller.confirmarCodigo);

export default router;
