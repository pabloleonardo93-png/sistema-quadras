import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";

const QuadraModalidade = sequelize.define("QuadraModalidade", {
  quadraId: { type: DataTypes.INTEGER, allowNull: false, primaryKey: true, field: "quadra_id" },
  modalidadeId: { type: DataTypes.INTEGER, allowNull: false, primaryKey: true, field: "modalidade_id" },
}, { tableName: "quadras_modalidades", timestamps: false, underscored: true });

export default QuadraModalidade;
