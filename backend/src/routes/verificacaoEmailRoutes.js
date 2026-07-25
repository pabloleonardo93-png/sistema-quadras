import { Router } from "express";
import * as controller from "../controllers/verificacaoEmailController.js";

const router = Router();

router.get("/sessao", controller.obterSessao);
router.post("/enviar", controller.solicitarCodigo);
router.post("/confirmar", controller.confirmarCodigo);

export default router;
