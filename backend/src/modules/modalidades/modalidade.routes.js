import { Router } from "express";
import { autenticarAdministrador } from "../../middlewares/authMiddleware.js";
import * as controller from "./modalidade.controller.js";
import {
  validarDadosModalidade,
  validarIdModalidade,
  validarStatusModalidade,
} from "./modalidade.validation.js";

const router = Router();

router.get("/", controller.listar);
router.get("/:id", validarIdModalidade, controller.buscarPorId);
router.post("/", autenticarAdministrador, validarDadosModalidade, controller.criar);
router.put("/:id", autenticarAdministrador, validarIdModalidade, validarDadosModalidade, controller.atualizar);
router.patch("/:id/status", autenticarAdministrador, validarIdModalidade, validarStatusModalidade, controller.alterarStatus);

export default router;
