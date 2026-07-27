export function mascararEmail(email) {
  const [usuario, dominio] = String(email || "").trim().split("@");
  if (!usuario || !dominio) return "";
  return `${usuario.slice(0, Math.min(3, usuario.length))}${"*".repeat(Math.max(2, usuario.length - 3))}@${dominio}`;
}

export function mascararTelefone(telefone) {
  const digitos = String(telefone || "").replace(/\D/g, "");
  if (digitos.length < 10) return "";
  const ddd = digitos.slice(0, 2);
  const final = digitos.slice(-4);
  return `(${ddd}) ${digitos.length === 11 ? "9" : ""}****-${final}`;
}
