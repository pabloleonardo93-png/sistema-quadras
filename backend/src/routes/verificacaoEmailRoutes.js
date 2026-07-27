import { Router } from "express";
import * as controller from "../controllers/verificacaoEmailController.js";
import validarOrigemMutavel from "../middlewares/validarOrigemMutavel.js";

const router = Router();

router.use(validarOrigemMutavel);
router.get("/sessao", controller.obterSessao);
router.post("/enviar", controller.solicitarCodigo);
router.post("/confirmar", controller.confirmarCodigo);
router.post("/encerrar", controller.encerrarSessao);

export default router;
