import { Router } from "express";
import * as controller from "../controllers/clienteController.js";
import { autenticarAdministrador } from "../middlewares/authMiddleware.js";

const router = Router();
router.post("/", controller.criar);
router.use(autenticarAdministrador);
router.get("/", controller.listar);
router.get("/:id", controller.buscarPorId);
router.put("/:id", controller.atualizar);
router.patch("/:id/status", controller.alterarStatus);
export default router;
