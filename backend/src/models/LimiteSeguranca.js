import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";
import { opcoesComuns } from "./opcoesComuns.js";

const LimiteSeguranca = sequelize.define("LimiteSeguranca", {
  chave: { type: DataTypes.STRING(160), allowNull: false },
  inicioJanela: { type: DataTypes.DATE, allowNull: false, field: "inicio_janela" },
  expiraEm: { type: DataTypes.DATE, allowNull: false, field: "expira_em" },
  quantidade: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
}, {
  ...opcoesComuns,
  tableName: "limites_seguranca",
  indexes: [{ name: "limites_seguranca_chave_janela_unique", unique: true, fields: ["chave", "inicio_janela"] }],
});

export default LimiteSeguranca;
