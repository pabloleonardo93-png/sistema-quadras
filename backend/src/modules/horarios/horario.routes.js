import { Router } from "express";
import { autenticarAdministrador } from "../../middlewares/authMiddleware.js";
import * as controller from "./horario.controller.js";
import {
  validarCriacaoHorario,
  validarIdHorario,
  validarListagemDisponiveis,
  validarListagemHorarios,
} from "./horario.validation.js";

const router = Router();
router.get("/disponiveis", validarListagemDisponiveis, controller.listarDisponiveis);
router.get("/", (req, res, next) => {
  const consultaPublica = req.query.quadra_id || req.query.modalidade_id;
  if (consultaPublica) return validarListagemDisponiveis(req, res, () => controller.listarDisponiveis(req, res, next));
  return autenticarAdministrador(req, res, () =>
    validarListagemHorarios(req, res, () => controller.listar(req, res, next)),
  );
});
router.use(autenticarAdministrador);
router.post("/", validarCriacaoHorario, controller.criar);
router.patch("/:id/bloquear", validarIdHorario, controller.bloquear);
router.patch("/:id/liberar", validarIdHorario, controller.liberar);
export default router;
