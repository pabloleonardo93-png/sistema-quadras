import ErroDaAplicacao from "./ErroDaAplicacao.js";

export function validarId(id, nome = "Identificador") {
  const numero = Number(id);
  if (!Number.isInteger(numero) || numero <= 0) {
    throw new ErroDaAplicacao(nome + " inválido.");
  }
  return numero;
}

export function validarTexto(valor, nome, tamanhoMaximo = 180) {
  if (typeof valor !== "string" || valor.trim().length === 0) {
    throw new ErroDaAplicacao(nome + " é obrigatório.");
  }
  const texto = valor.trim();
  if (texto.length > tamanhoMaximo) {
    throw new ErroDaAplicacao(nome + " deve ter no máximo " + tamanhoMaximo + " caracteres.");
  }
  return texto;
}

export function validarEmail(email) {
  const emailNormalizado = validarTexto(email, "E-mail", 160).toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailNormalizado)) {
    throw new ErroDaAplicacao("E-mail inválido.");
  }
  return emailNormalizado;
}

export function validarStatus(status, permitidos, nome = "Status") {
  if (!permitidos.includes(status)) {
    throw new ErroDaAplicacao(nome + " inválido.");
  }
  return status;
}

export function validarData(data) {
  if (typeof data !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(data)) {
    throw new ErroDaAplicacao("Data deve estar no formato AAAA-MM-DD.");
  }
  const [ano, mes, dia] = data.split("-").map(Number);
  const criada = new Date(Date.UTC(ano, mes - 1, dia));
  if (criada.getUTCFullYear() !== ano || criada.getUTCMonth() !== mes - 1 || criada.getUTCDate() !== dia) {
    throw new ErroDaAplicacao("Data inválida.");
  }
  return data;
}

export function validarHora(hora, nome = "Horário") {
  if (typeof hora !== "string" || !/^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/.test(hora)) {
    throw new ErroDaAplicacao(nome + " deve estar no formato HH:MM.");
  }
  return hora.slice(0, 5);
}

export function validarValorPositivo(valor, nome = "Valor") {
  const numero = Number(valor);
  if (!Number.isFinite(numero) || numero < 0) {
    throw new ErroDaAplicacao(nome + " inválido.");
  }
  return numero;
}

export function hojeLocal() {
  const agora = new Date();
  const ano = agora.getFullYear();
  const mes = String(agora.getMonth() + 1).padStart(2, "0");
  const dia = String(agora.getDate()).padStart(2, "0");
  return ano + "-" + mes + "-" + dia;
}
