import { Resend } from "resend";
import {
  resendFromEmail,
  resendTemplateVerificacaoId,
} from "../config/verificacaoEmail.js";
import ErroDaAplicacao from "../utils/ErroDaAplicacao.js";

let clienteResend = null;
let apiKeyCliente = "";

function campoObrigatorio(nome, valor) {
  if (typeof valor !== "string" || valor.trim() === "") {
    throw new ErroDaAplicacao(`${nome} nao configurado.`, 503);
  }

  return valor.trim();
}

export function validarConfiguracaoResend({
  apiKey = process.env.RESEND_API_KEY,
  remetente = resendFromEmail,
  templateId = resendTemplateVerificacaoId,
} = {}) {
  return {
    apiKey: campoObrigatorio("RESEND_API_KEY", apiKey),
    remetente: campoObrigatorio("EMAIL_FROM ou RESEND_FROM_EMAIL", remetente),
    templateId: campoObrigatorio("RESEND_TEMPLATE_VERIFICACAO_ID", templateId),
  };
}

function obterClienteResend(apiKey) {
  if (!clienteResend || apiKeyCliente !== apiKey) {
    clienteResend = new Resend(apiKey);
    apiKeyCliente = apiKey;
  }

  return clienteResend;
}

export function montarPayloadTemplateVerificacao({
  email,
  codigo,
  remetente,
  templateId,
}) {
  const codigoTexto = String(codigo ?? "").trim();
  if (!email || !codigoTexto) {
    throw new ErroDaAplicacao("E-mail e codigo sao obrigatorios.", 400);
  }

  return {
    from: remetente,
    to: [email],
    template: {
      id: templateId,
      variables: {
        codigo: codigoTexto,
      },
    },
  };
}

export function tratarResultadoResend(resultado) {
  if (resultado?.error) {
    throw new ErroDaAplicacao(
      "Nao foi possivel enviar o codigo de verificacao.",
      503,
    );
  }

  return resultado?.data || resultado;
}

export async function enviarCodigoPorResend({ email, codigo }) {
  const configuracao = validarConfiguracaoResend();
  const cliente = obterClienteResend(configuracao.apiKey);
  const payload = montarPayloadTemplateVerificacao({
    email,
    codigo: String(codigo),
    remetente: configuracao.remetente,
    templateId: configuracao.templateId,
  });

  const resultado = await cliente.emails.send(payload);
  return tratarResultadoResend(resultado);
}
