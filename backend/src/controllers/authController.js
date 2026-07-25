import bcrypt from "bcrypt";
import Admin from "../models/Admin.js";
import { registrarLog } from "../services/logService.js";
import ErroDaAplicacao from "../utils/ErroDaAplicacao.js";
import executarAssincrono from "../utils/executarAssincrono.js";
import { gerarToken } from "../utils/gerarToken.js";
import { validarEmail, validarTexto } from "../utils/validacoes.js";

export const login = executarAssincrono(async (req, res) => {
  const email = validarEmail(req.body.email);
  const senha = validarTexto(req.body.senha, "Senha", 200);
  const administradorComSenha = await Admin.scope("comSenha").findOne({ where: { email } });

  if (!administradorComSenha || administradorComSenha.status !== "ativo") {
    throw new ErroDaAplicacao("E-mail ou senha inválidos.", 401);
  }
  const senhaCorreta = await bcrypt.compare(senha, administradorComSenha.senhaHash);
  if (!senhaCorreta) {
    throw new ErroDaAplicacao("E-mail ou senha inválidos.", 401);
  }

  await registrarLog({
    adminId: administradorComSenha.id,
    acao: "login_realizado",
    entidade: "administrador",
    entidadeId: administradorComSenha.id,
    enderecoIp: req.ip,
  });
  const administrador = await Admin.findByPk(administradorComSenha.id);
  res.json({
    mensagem: "Login realizado com sucesso.",
    token: gerarToken(administradorComSenha),
    administrador,
  });
});

export const me = executarAssincrono(async (req, res) => {
  res.json({ administrador: req.admin });
});
