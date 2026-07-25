import executarAssincrono from "../../utils/executarAssincrono.js";
import * as service from "./auth.service.js";

export const login = executarAssincrono(async (req, res) => {
  const { token, administrador } = await service.login({
    ...req.dadosValidados.auth,
    enderecoIp: req.ip,
  });

  res.json({
    mensagem: "Login realizado com sucesso.",
    token,
    administrador,
  });
});

export const me = executarAssincrono(async (req, res) => {
  res.json({ administrador: req.admin });
});
