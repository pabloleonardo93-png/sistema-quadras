import { Router } from "express";
import * as controller from "../controllers/pagamentoController.js";
import { validarEmailVerificado } from "../middlewares/validarEmailVerificado.js";
import validarOrigemMutavel from "../middlewares/validarOrigemMutavel.js";

const router = Router();

// Aliases legados: webhooks possuem assinatura propria e nao usam a sessao do navegador.
router.post("/mercadopago/webhook", controller.webhookMercadoPago);
router.post("/mercado-pago/webhook", controller.webhookMercadoPago);
router.use(validarOrigemMutavel);
router.post("/mercadopago/criar", validarEmailVerificado, controller.criarPagamentoMercadoPago);
router.post("/mercadopago/pix/criar", validarEmailVerificado, controller.criarPixMercadoPago);

export default router;
