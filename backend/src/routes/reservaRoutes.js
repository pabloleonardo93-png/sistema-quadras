import { Router } from "express";
import * as controller from "../controllers/reservaController.js";
import { autenticarAdministrador } from "../middlewares/authMiddleware.js";

const router = Router();
router.post("/", controller.criar);
router.use(autenticarAdministrador);
router.get("/", controller.listar);
router.get("/:id", controller.buscarPorId);
router.patch("/:id/confirmar", controller.confirmar);
router.patch("/:id/cancelar", controller.cancelar);
router.patch("/:id/finalizar", controller.finalizar);
export default router;
