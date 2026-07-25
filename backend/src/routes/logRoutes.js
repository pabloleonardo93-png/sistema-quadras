import { Router } from "express";
import * as controller from "../controllers/logController.js";
import { autenticarAdministrador } from "../middlewares/authMiddleware.js";

const router = Router();
router.use(autenticarAdministrador);
router.get("/", controller.listar);
router.get("/:id", controller.buscarPorId);
export default router;
