import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";
import { opcoesComuns } from "./opcoesComuns.js";

const Arquivo = sequelize.define("Arquivo", {
  adminId: { type: DataTypes.INTEGER, allowNull: true, field: "admin_id" },
  nomeOriginal: { type: DataTypes.STRING(255), allowNull: false, field: "nome_original" },
  nomeArmazenado: { type: DataTypes.STRING(255), allowNull: false, unique: true, field: "nome_armazenado" },
  tipoMime: { type: DataTypes.STRING(100), allowNull: false, field: "tipo_mime" },
  tamanho: { type: DataTypes.INTEGER, allowNull: false },
  caminho: { type: DataTypes.STRING(500), allowNull: false },
  entidade: { type: DataTypes.STRING(80), allowNull: true },
  entidadeId: { type: DataTypes.INTEGER, allowNull: true, field: "entidade_id" },
}, { ...opcoesComuns, tableName: "arquivos" });

export default Arquivo;
