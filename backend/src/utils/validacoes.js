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

const dddsValidosBrasil = new Set([
  "11", "12", "13", "14", "15", "16", "17", "18", "19",
  "21", "22", "24", "27", "28",
  "31", "32", "33", "34", "35", "37", "38",
  "41", "42", "43", "44", "45", "46", "47", "48", "49",
  "51", "53", "54", "55",
  "61", "62", "63", "64", "65", "66", "67", "68", "69",
  "71", "73", "74", "75", "77", "79",
  "81", "82", "83", "84", "85", "86", "87", "88", "89",
  "91", "92", "93", "94", "95", "96", "97", "98", "99",
]);

function somenteDigitos(valor) {
  return String(valor || "").replace(/\D/g, "");
}

function removerCodigoPaisBrasil(digitos) {
  if ((digitos.length === 12 || digitos.length === 13) && digitos.startsWith("55")) {
    return digitos.slice(2);
  }
  return digitos;
}

function ehSequenciaObvia(digitos) {
  const sequencias = ["0123456789", "1234567890", "9876543210", "0987654321"];
  return sequencias.some((sequencia) => digitos.includes(sequencia));
}

export function normalizarTelefoneBrasil(telefone) {
  return removerCodigoPaisBrasil(somenteDigitos(telefone));
}

export function formatarTelefoneBrasil(telefone) {
  const digitos = normalizarTelefoneBrasil(telefone);
  if (digitos.length === 10) {
    return `(${digitos.slice(0, 2)}) ${digitos.slice(2, 6)}-${digitos.slice(6)}`;
  }
  if (digitos.length === 11) {
    return `(${digitos.slice(0, 2)}) ${digitos.slice(2, 7)}-${digitos.slice(7)}`;
  }
  return telefone;
}

export function validarTelefoneBrasil(telefone) {
  const digitos = normalizarTelefoneBrasil(telefone);

  if (!digitos) {
    throw new ErroDaAplicacao("Telefone e obrigatorio.");
  }

  if (![10, 11].includes(digitos.length)) {
    throw new ErroDaAplicacao("Telefone deve ter DDD e 10 ou 11 digitos.");
  }

  const ddd = digitos.slice(0, 2);
  const numero = digitos.slice(2);

  if (!dddsValidosBrasil.has(ddd)) {
    throw new ErroDaAplicacao("Informe um DDD valido.");
  }

  if (/^(\d)\1+$/.test(digitos) || /^(\d)\1+$/.test(numero) || ehSequenciaObvia(digitos)) {
    throw new ErroDaAplicacao("Informe um telefone valido.");
  }

  if (digitos.length === 11 && digitos[2] !== "9") {
    throw new ErroDaAplicacao("Telefone celular deve comecar com 9 apos o DDD.");
  }

  return formatarTelefoneBrasil(digitos);
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
