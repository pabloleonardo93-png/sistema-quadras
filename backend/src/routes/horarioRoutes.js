import { Router } from "express";
import * as controller from "../controllers/horarioController.js";
import { autenticarAdministrador } from "../middlewares/authMiddleware.js";

const router = Router();
router.get("/disponiveis", controller.listarDisponiveis);
router.use(autenticarAdministrador);
router.post("/", controller.criar);
router.get("/", controller.listar);
router.patch("/:id/bloquear", controller.bloquear);
router.patch("/:id/liberar", controller.liberar);
export default router;
