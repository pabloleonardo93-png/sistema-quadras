import { Router } from "express";
import { webhookMercadoPago } from "../controllers/pagamentoController.js";

const router = Router();

router.post("/mercadopago", webhookMercadoPago);

export default router;
