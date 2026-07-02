import { Router } from "express";
import * as controller from "../controllers/pagamentoController.js";

const router = Router();

router.post("/mercadopago/criar", controller.criarPagamentoMercadoPago);
router.post("/mercadopago/webhook", controller.webhookMercadoPago);
router.post("/mercado-pago/webhook", controller.webhookMercadoPago);

export default router;
