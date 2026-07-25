const PHONE_MIN_DIGITS = 10;
const PHONE_MAX_DIGITS = 11;
const VALID_BRAZILIAN_DDDS = new Set([
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

function getPhoneDigits(value) {
  return value.replace(/\D/g, "");
}

export function normalizeBrazilianPhone(value) {
  const digits = getPhoneDigits(value);
  if ((digits.length === 12 || digits.length === 13) && digits.startsWith("55")) {
    return digits.slice(2);
  }
  return digits;
}

export function validateBrazilianPhone(value) {
  const digits = normalizeBrazilianPhone(value);
  if (![PHONE_MIN_DIGITS, PHONE_MAX_DIGITS].includes(digits.length)) {
    return "Informe um telefone com DDD e 10 ou 11 digitos.";
  }

  const ddd = digits.slice(0, 2);
  const number = digits.slice(2);
  if (!VALID_BRAZILIAN_DDDS.has(ddd)) {
    return "Informe um DDD valido.";
  }

  if (/^(\d)\1+$/.test(digits) || /^(\d)\1+$/.test(number)) {
    return "Informe um telefone valido.";
  }

  if (digits.length === PHONE_MAX_DIGITS && digits[2] !== "9") {
    return "Telefone celular deve comecar com 9 apos o DDD.";
  }

  return "";
}

export function formatBrazilianPhone(value) {
  const digits = normalizeBrazilianPhone(value).slice(0, PHONE_MAX_DIGITS);

  if (digits.length <= 2) return digits ? `(${digits}` : "";
  if (digits.length <= 6) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  }
  if (digits.length <= 10) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  }

  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}
