import { Router } from "express";
import * as controller from "../controllers/authController.js";
import { autenticarAdministrador } from "../middlewares/authMiddleware.js";

const router = Router();
router.post("/login", controller.login);
router.get("/me", autenticarAdministrador, controller.me);
export default router;
