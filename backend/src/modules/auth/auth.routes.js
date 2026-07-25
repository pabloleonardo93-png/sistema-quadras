import { Router } from "express";
import { autenticarAdministrador } from "../../middlewares/authMiddleware.js";
import * as controller from "./auth.controller.js";
import { validarLogin } from "./auth.validation.js";

const router = Router();

router.post("/login", validarLogin, controller.login);
router.get("/me", autenticarAdministrador, controller.me);

export default router;
