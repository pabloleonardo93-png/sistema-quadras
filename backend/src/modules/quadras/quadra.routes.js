import { Router } from "express";
import { autenticarAdministrador } from "../../middlewares/authMiddleware.js";
import * as controller from "./quadra.controller.js";
import { validarDadosQuadra, validarIdQuadra, validarStatusQuadra } from "./quadra.validation.js";

const router = Router();

router.get("/admin/todas", autenticarAdministrador, controller.listarAdmin);
router.get("/", controller.listar);
router.get("/:id", validarIdQuadra, controller.buscarPorId);
router.post("/", autenticarAdministrador, validarDadosQuadra, controller.criar);
router.put("/:id", autenticarAdministrador, validarIdQuadra, validarDadosQuadra, controller.atualizar);
router.patch("/:id/status", autenticarAdministrador, validarIdQuadra, validarStatusQuadra, controller.alterarStatus);

export default router;
