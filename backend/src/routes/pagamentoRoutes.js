import { Router } from "express";
import * as controller from "../controllers/pagamentoController.js";
import { validarEmailVerificado } from "../middlewares/validarEmailVerificado.js";

const router = Router();

router.post("/mercadopago/criar", validarEmailVerificado, controller.criarPagamentoMercadoPago);
router.post("/mercadopago/pix/criar", validarEmailVerificado, controller.criarPixMercadoPago);
router.post("/mercadopago/webhook", controller.webhookMercadoPago);
router.post("/mercado-pago/webhook", controller.webhookMercadoPago);

export default router;
