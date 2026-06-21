import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";
import { opcoesComuns } from "./opcoesComuns.js";

const LogSistema = sequelize.define("LogSistema", {
  adminId: { type: DataTypes.INTEGER, allowNull: true, field: "admin_id" },
  acao: { type: DataTypes.STRING(120), allowNull: false },
  entidade: { type: DataTypes.STRING(80), allowNull: true },
  entidadeId: { type: DataTypes.INTEGER, allowNull: true, field: "entidade_id" },
  enderecoIp: { type: DataTypes.STRING(80), allowNull: true, field: "endereco_ip" },
  detalhes: { type: DataTypes.JSONB, allowNull: true },
}, { ...opcoesComuns, tableName: "logs_sistema" });

export default LogSistema;
