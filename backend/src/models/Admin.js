import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";
import { opcoesComuns } from "./opcoesComuns.js";

const Admin = sequelize.define("Admin", {
  nome: { type: DataTypes.STRING(120), allowNull: false },
  email: { type: DataTypes.STRING(160), allowNull: false, unique: true, validate: { isEmail: true } },
  senhaHash: { type: DataTypes.STRING(255), allowNull: false, field: "senha_hash" },
  permissao: { type: DataTypes.ENUM("administrador", "gerente"), allowNull: false, defaultValue: "administrador" },
  status: { type: DataTypes.ENUM("ativo", "inativo"), allowNull: false, defaultValue: "ativo" },
}, {
  ...opcoesComuns,
  tableName: "administradores",
  defaultScope: { attributes: { exclude: ["senhaHash"] } },
  scopes: { comSenha: { attributes: { include: ["senhaHash"] } } },
});

export default Admin;
