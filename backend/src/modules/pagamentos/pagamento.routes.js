import { Router } from "express";
import { validarEmailVerificado } from "../../middlewares/validarEmailVerificado.js";
import { limitarCriacaoPagamentoPublico } from "../../middlewares/rateLimitMiddleware.js";
import * as controller from "./pagamento.controller.js";

export const pagamentoRoutes = Router();
pagamentoRoutes.post("/mercadopago/criar", limitarCriacaoPagamentoPublico, validarEmailVerificado, controller.criarPagamentoMercadoPago);
pagamentoRoutes.post("/mercadopago/pix/criar", limitarCriacaoPagamentoPublico, validarEmailVerificado, controller.criarPixMercadoPago);
pagamentoRoutes.post("/mercadopago/webhook", controller.webhookMercadoPago);
pagamentoRoutes.post("/mercado-pago/webhook", controller.webhookMercadoPago);

export const webhookRoutes = Router();
webhookRoutes.post("/mercadopago", controller.webhookMercadoPago);

export default pagamentoRoutes;
