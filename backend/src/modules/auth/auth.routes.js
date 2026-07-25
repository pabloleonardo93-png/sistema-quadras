import { Router } from "express";
import { autenticarAdministrador } from "../../middlewares/authMiddleware.js";
import { limitarLoginAdministrativo } from "../../middlewares/rateLimitMiddleware.js";
import * as controller from "./auth.controller.js";
import { validarLogin } from "./auth.validation.js";

const router = Router();

router.post("/login", limitarLoginAdministrativo, validarLogin, controller.login);
router.get("/me", autenticarAdministrador, controller.me);

export default router;
