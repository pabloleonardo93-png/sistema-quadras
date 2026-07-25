import { Router } from "express";
import { autenticarAdministrador } from "../../middlewares/authMiddleware.js";
import * as controller from "./auditoria.controller.js";
import { validarIdLog, validarListagemLogs } from "./auditoria.validation.js";

const router = Router();

router.use(autenticarAdministrador);
router.get("/", validarListagemLogs, controller.listar);
router.get("/:id", validarIdLog, controller.buscarPorId);

export default router;
