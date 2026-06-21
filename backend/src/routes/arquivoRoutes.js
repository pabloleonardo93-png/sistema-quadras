import { Router } from "express";
import * as controller from "../controllers/arquivoController.js";
import { autenticarAdministrador } from "../middlewares/authMiddleware.js";
import { upload } from "../middlewares/uploadMiddleware.js";

const router = Router();
router.use(autenticarAdministrador);
router.post("/upload", upload.single("arquivo"), controller.enviar);
router.get("/", controller.listar);
router.delete("/:id", controller.remover);
export default router;
