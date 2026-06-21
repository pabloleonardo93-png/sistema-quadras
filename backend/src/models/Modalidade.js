import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";
import { opcoesComuns } from "./opcoesComuns.js";

const Modalidade = sequelize.define("Modalidade", {
  nome: { type: DataTypes.STRING(100), allowNull: false, unique: true },
  descricao: { type: DataTypes.TEXT, allowNull: true },
  status: { type: DataTypes.ENUM("ativa", "inativa"), allowNull: false, defaultValue: "ativa" },
}, { ...opcoesComuns, tableName: "modalidades" });

export default Modalidade;
