import { Router } from "express";
import { autenticarAdministrador } from "../../middlewares/authMiddleware.js";
import { validarEmailVerificado } from "../../middlewares/validarEmailVerificado.js";
import * as controller from "./cliente.controller.js";
import {
  validarAlteracaoStatus,
  validarAtualizacao,
  validarCriacaoPublica,
  validarIdCliente,
  validarListagem,
  validarPerfilVerificado,
} from "./cliente.validation.js";

const router = Router();

router.get("/me", validarEmailVerificado, validarPerfilVerificado, controller.perfilVerificado);
router.post("/", validarEmailVerificado, validarCriacaoPublica, controller.criar);
router.use(autenticarAdministrador);
router.get("/", validarListagem, controller.listar);
router.get("/:id", validarIdCliente, controller.buscarPorId);
router.put("/:id", validarIdCliente, validarAtualizacao, controller.atualizar);
router.patch("/:id/status", validarIdCliente, validarAlteracaoStatus, controller.alterarStatus);

export default router;
