import { Router } from "express";
import { autenticarAdministrador } from "../../middlewares/authMiddleware.js";
import * as controller from "./arquivo.controller.js";
import { upload } from "./arquivo.upload.js";
import { validarIdArquivo, validarMetadadosArquivo } from "./arquivo.validation.js";

const router = Router();

router.use(autenticarAdministrador);
router.post("/upload", upload.single("arquivo"), validarMetadadosArquivo, controller.enviar);
router.get("/", controller.listar);
router.delete("/:id", validarIdArquivo, controller.remover);

export default router;
