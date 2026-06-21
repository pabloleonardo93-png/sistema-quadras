import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";
import { opcoesComuns } from "./opcoesComuns.js";

const Cliente = sequelize.define("Cliente", {
  nome: { type: DataTypes.STRING(120), allowNull: false },
  telefone: { type: DataTypes.STRING(30), allowNull: false },
  email: { type: DataTypes.STRING(160), allowNull: false, unique: true, validate: { isEmail: true } },
  status: { type: DataTypes.ENUM("ativo", "inativo"), allowNull: false, defaultValue: "ativo" },
}, { ...opcoesComuns, tableName: "clientes" });

export default Cliente;
