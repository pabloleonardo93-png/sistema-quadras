import { Router } from "express";
import * as controller from "../controllers/relatorioController.js";
import { autenticarAdministrador } from "../middlewares/authMiddleware.js";

const router = Router();
router.post("/acessos", controller.registrarAcesso);
router.use(autenticarAdministrador);
router.get("/dashboard", controller.dashboard);
router.get("/reservas", controller.reservas);
router.get("/ocupacao", controller.ocupacao);
router.get("/modalidades", controller.modalidades);
router.get("/acessos", controller.acessos);
export default router;
