import jwt from "jsonwebtoken";

export function gerarToken(admin) {
  return jwt.sign(
    { permissao: admin.permissao },
    process.env.JWT_SECRET,
    {
      subject: String(admin.id),
      expiresIn: process.env.JWT_EXPIRES_IN || "1d",
    },
  );
}
