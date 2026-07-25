import { Router } from "express";
import * as controller from "../controllers/comunicadoController.js";
import { autenticarAdministrador } from "../middlewares/authMiddleware.js";

const router = Router();
router.get("/publicos", controller.listarPublicos);
router.use(autenticarAdministrador);
router.post("/", controller.criar);
router.get("/", controller.listar);
router.get("/:id", controller.buscarPorId);
router.put("/:id", controller.atualizar);
router.patch("/:id/publicar", controller.publicar);
router.patch("/:id/arquivar", controller.arquivar);
export default router;
