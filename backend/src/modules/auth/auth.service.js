import bcrypt from "bcrypt";
import { registrarLog } from "../../services/logService.js";
import { ADMIN_STATUS } from "../../shared/constants/statusAdministrativos.js";
import ErroDaAplicacao from "../../utils/ErroDaAplicacao.js";
import { gerarToken } from "../../utils/gerarToken.js";
import * as repository from "./auth.repository.js";

export async function login({ email, senha, enderecoIp }) {
  const administradorComSenha = await repository.buscarPorEmailComSenha(email);

  if (!administradorComSenha || administradorComSenha.status !== ADMIN_STATUS.ATIVO) {
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
    enderecoIp,
  });

  const administrador = await repository.buscarPorId(administradorComSenha.id);
  return {
    token: gerarToken(administradorComSenha),
    administrador,
  };
}
