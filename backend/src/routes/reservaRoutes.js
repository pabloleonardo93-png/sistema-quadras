import { Router } from "express";
import { criarCheckoutReserva } from "../controllers/pagamentoController.js";
import * as controller from "../controllers/reservaController.js";
import { autenticarAdministrador } from "../middlewares/authMiddleware.js";
import { validarEmailVerificado } from "../middlewares/validarEmailVerificado.js";

const router = Router();
router.post("/", validarEmailVerificado, controller.criar);
router.post("/:id/pagamento", criarCheckoutReserva);
router.get("/:id/status", controller.statusPublico);
router.use(autenticarAdministrador);
router.get("/", controller.listar);
router.get("/:id", controller.buscarPorId);
router.patch("/:id/confirmar", controller.confirmar);
router.patch("/:id/cancelar", controller.cancelar);
router.patch("/:id/finalizar", controller.finalizar);
export default router;
