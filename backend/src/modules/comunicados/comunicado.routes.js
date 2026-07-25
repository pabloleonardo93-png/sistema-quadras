import { Router } from "express";
import { autenticarAdministrador } from "../../middlewares/authMiddleware.js";
import * as controller from "./comunicado.controller.js";
import {
  validarDadosComunicado,
  validarFiltroComunicados,
  validarIdComunicado,
} from "./comunicado.validation.js";

const router = Router();

router.get("/publicos", controller.listarPublicos);
router.use(autenticarAdministrador);
router.post("/", validarDadosComunicado, controller.criar);
router.get("/", validarFiltroComunicados, controller.listar);
router.get("/:id", validarIdComunicado, controller.buscarPorId);
router.put("/:id", validarIdComunicado, validarDadosComunicado, controller.atualizar);
router.patch("/:id/publicar", validarIdComunicado, controller.publicar);
router.patch("/:id/arquivar", validarIdComunicado, controller.arquivar);

export default router;
