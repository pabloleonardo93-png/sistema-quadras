import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";
import {
  ADMIN_PERMISSAO,
  ADMIN_PERMISSAO_LISTA,
  ADMIN_STATUS,
  ADMIN_STATUS_LISTA,
} from "../shared/constants/statusAdministrativos.js";
import { opcoesComuns } from "./opcoesComuns.js";

const Admin = sequelize.define("Admin", {
  nome: { type: DataTypes.STRING(120), allowNull: false },
  email: { type: DataTypes.STRING(160), allowNull: false, unique: true, validate: { isEmail: true } },
  senhaHash: { type: DataTypes.STRING(255), allowNull: false, field: "senha_hash" },
  permissao: { type: DataTypes.ENUM(...ADMIN_PERMISSAO_LISTA), allowNull: false, defaultValue: ADMIN_PERMISSAO.ADMINISTRADOR },
  status: { type: DataTypes.ENUM(...ADMIN_STATUS_LISTA), allowNull: false, defaultValue: ADMIN_STATUS.ATIVO },
}, {
  ...opcoesComuns,
  tableName: "administradores",
  defaultScope: { attributes: { exclude: ["senhaHash"] } },
  scopes: { comSenha: { attributes: { include: ["senhaHash"] } } },
});

export default Admin;
