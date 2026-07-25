import { Router } from "express";
import { criarCheckoutReserva } from "../../controllers/pagamentoController.js";
import { autenticarAdministrador } from "../../middlewares/authMiddleware.js";
import { validarEmailVerificado } from "../../middlewares/validarEmailVerificado.js";
import * as controller from "./reserva.controller.js";
import {
  prepararCriacaoReserva,
  validarIdReserva,
  validarListagemReservas,
} from "./reserva.validation.js";

const router = Router();
router.post("/", validarEmailVerificado, prepararCriacaoReserva, controller.criar);
router.post("/:id/pagamento", criarCheckoutReserva);
router.get("/:id/status", validarIdReserva, controller.statusPublico);
router.use(autenticarAdministrador);
router.get("/", validarListagemReservas, controller.listar);
router.get("/:id", validarIdReserva, controller.buscarPorId);
router.patch("/:id/confirmar", validarIdReserva, controller.confirmar);
router.patch("/:id/cancelar", validarIdReserva, controller.cancelar);
router.patch("/:id/finalizar", validarIdReserva, controller.finalizar);
export default router;
