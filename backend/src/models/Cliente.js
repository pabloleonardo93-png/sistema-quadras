import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";
import { CLIENTE_STATUS, CLIENTE_STATUS_LISTA } from "../shared/constants/statusAdministrativos.js";
import { opcoesComuns } from "./opcoesComuns.js";

const Cliente = sequelize.define("Cliente", {
  nome: { type: DataTypes.STRING(120), allowNull: false },
  telefone: { type: DataTypes.STRING(30), allowNull: false },
  email: { type: DataTypes.STRING(160), allowNull: false, unique: true, validate: { isEmail: true } },
  emailVerificadoEm: { type: DataTypes.DATE, allowNull: true, field: "email_verificado_em" },
  status: { type: DataTypes.ENUM(...CLIENTE_STATUS_LISTA), allowNull: false, defaultValue: CLIENTE_STATUS.ATIVO },
}, { ...opcoesComuns, tableName: "clientes" });

export default Cliente;
