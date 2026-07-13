import { resendFromEmail } from "../config/verificacaoEmail.js";
import ErroDaAplicacao from "../utils/ErroDaAplicacao.js";

const API_RESEND_EMAILS = "https://api.resend.com/emails";

function montarEmailHtml({ codigo, validadeMinutos }) {
  return `
    <div style="font-family: Arial, sans-serif; color: #15201e; line-height: 1.5;">
      <h1 style="font-size: 22px;">Codigo de verificacao</h1>
      <p>Use o codigo abaixo para continuar sua reserva no Pe na Areia.</p>
      <p style="font-size: 32px; font-weight: 700; letter-spacing: 6px;">${codigo}</p>
      <p>Ele e valido por ${validadeMinutos} minutos.</p>
    </div>
  `;
}

export async function enviarCodigoPorResend({ email, codigo, validadeMinutos }) {
  if (!process.env.RESEND_API_KEY) {
    throw new ErroDaAplicacao("Resend nao configurado. Defina RESEND_API_KEY no backend.", 503);
  }

  if (!resendFromEmail) {
    throw new ErroDaAplicacao("Defina RESEND_FROM_EMAIL com um remetente verificado no Resend.", 503);
  }

  const resposta = await fetch(API_RESEND_EMAILS, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: resendFromEmail,
      to: [email],
      subject: "Codigo para continuar sua reserva",
      html: montarEmailHtml({ codigo, validadeMinutos }),
      text: `Seu codigo de verificacao e ${codigo}. Ele e valido por ${validadeMinutos} minutos.`,
    }),
  });

  const texto = await resposta.text();
  let dados = null;
  if (texto) {
    try {
      dados = JSON.parse(texto);
    } catch {
      dados = { message: texto };
    }
  }

  if (!resposta.ok) {
    throw new ErroDaAplicacao(dados?.message || "Nao foi possivel enviar o codigo por e-mail.", 503);
  }

  return dados;
}
