import { Router } from "express";
import * as controller from "../controllers/modalidadeController.js";
import { autenticarAdministrador } from "../middlewares/authMiddleware.js";

const router = Router();
router.get("/", controller.listar);
router.get("/:id", controller.buscarPorId);
router.post("/", autenticarAdministrador, controller.criar);
router.put("/:id", autenticarAdministrador, controller.atualizar);
router.patch("/:id/status", autenticarAdministrador, controller.alterarStatus);
export default router;
