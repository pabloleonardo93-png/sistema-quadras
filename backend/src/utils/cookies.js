export function obterCookie(req, nome) {
  const header = req.headers?.cookie;
  if (!header || !nome) return "";

  const par = header
    .split(";")
    .map((item) => item.trim())
    .find((item) => item.startsWith(`${nome}=`));

  if (!par) return "";

  const valor = par.slice(nome.length + 1);
  try {
    return decodeURIComponent(valor);
  } catch {
    return valor;
  }
}
