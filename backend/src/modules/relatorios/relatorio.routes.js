import { Router } from "express";
import { autenticarAdministrador } from "../../middlewares/authMiddleware.js";
import { limitarRegistroAcessoPublico } from "../../middlewares/rateLimitMiddleware.js";
import * as controller from "./relatorio.controller.js";
import { validarFiltroAcessos, validarFiltroReservas, validarRegistroAcesso } from "./relatorio.validation.js";

const router = Router();

router.post("/acessos", limitarRegistroAcessoPublico, validarRegistroAcesso, controller.registrarAcesso);
router.use(autenticarAdministrador);
router.get("/dashboard", controller.dashboard);
router.get("/reservas", validarFiltroReservas, controller.reservas);
router.get("/ocupacao", controller.ocupacao);
router.get("/modalidades", controller.modalidades);
router.get("/acessos", validarFiltroAcessos, controller.acessos);

export default router;
