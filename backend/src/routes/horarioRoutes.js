import { Router } from "express";
import * as controller from "../controllers/horarioController.js";
import { autenticarAdministrador } from "../middlewares/authMiddleware.js";

const router = Router();
router.get("/disponiveis", controller.listarDisponiveis);
router.get("/", (req, res, next) => {
  const consultaPublica = req.query.quadra_id || req.query.modalidade_id;
  if (consultaPublica) return controller.listarDisponiveis(req, res, next);
  return autenticarAdministrador(req, res, () => controller.listar(req, res, next));
});
router.use(autenticarAdministrador);
router.post("/", controller.criar);
router.patch("/:id/bloquear", controller.bloquear);
router.patch("/:id/liberar", controller.liberar);
export default router;
