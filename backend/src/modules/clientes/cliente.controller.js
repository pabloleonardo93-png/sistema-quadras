import executarAssincrono from "../../utils/executarAssincrono.js";
import * as service from "./cliente.service.js";

export const criar = executarAssincrono(async (req, res) => {
  const cliente = await service.criarPublico({
    ...req.dadosValidados.cliente,
    enderecoIp: req.ip,
  });

  res.json({
    mensagem: "Dados do cliente salvos com sucesso.",
    cliente: service.clientePublico(cliente),
  });
});

export const perfilVerificado = executarAssincrono(async (req, res) => {
  const cliente = await service.buscarClientePorEmailValidado({
    email: req.dadosValidados.cliente.email,
  });

  res.json({
    email: req.dadosValidados.cliente.email,
    cliente: service.clientePublico(cliente),
  });
});

export const listar = executarAssincrono(async (req, res) => {
  const clientes = await service.listar(req.dadosValidados.cliente);
  res.json({ clientes });
});

export const buscarPorId = executarAssincrono(async (req, res) => {
  const cliente = await service.buscarPorId(req.dadosValidados.cliente.id);
  res.json({ cliente });
});

export const atualizar = executarAssincrono(async (req, res) => {
  const cliente = await service.atualizar({
    ...req.dadosValidados.cliente,
    adminId: req.admin.id,
    enderecoIp: req.ip,
  });
  res.json({ mensagem: "Cliente atualizado com sucesso.", cliente });
});

export const alterarStatus = executarAssincrono(async (req, res) => {
  const cliente = await service.alterarStatus({
    ...req.dadosValidados.cliente,
    adminId: req.admin.id,
    enderecoIp: req.ip,
  });
  res.json({ mensagem: "Status do cliente atualizado.", cliente });
});
