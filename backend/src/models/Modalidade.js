import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";
import { MODALIDADE_STATUS, MODALIDADE_STATUS_LISTA } from "../shared/constants/statusAdministrativos.js";
import { opcoesComuns } from "./opcoesComuns.js";

const Modalidade = sequelize.define("Modalidade", {
  nome: { type: DataTypes.STRING(100), allowNull: false, unique: true },
  descricao: { type: DataTypes.TEXT, allowNull: true },
  status: { type: DataTypes.ENUM(...MODALIDADE_STATUS_LISTA), allowNull: false, defaultValue: MODALIDADE_STATUS.ATIVA },
}, { ...opcoesComuns, tableName: "modalidades" });

export default Modalidade;
