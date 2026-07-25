import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";
import { opcoesComuns } from "./opcoesComuns.js";

const Quadra = sequelize.define("Quadra", {
  nome: { type: DataTypes.STRING(100), allowNull: false, unique: true },
  descricao: { type: DataTypes.TEXT, allowNull: true },
  valorHora: { type: DataTypes.DECIMAL(10, 2), allowNull: false, field: "valor_hora", validate: { min: 0 } },
  status: { type: DataTypes.ENUM("ativa", "manutencao", "inativa"), allowNull: false, defaultValue: "ativa" },
  imagemUrl: { type: DataTypes.STRING(500), allowNull: true, field: "imagem_url" },
}, { ...opcoesComuns, tableName: "quadras" });

export default Quadra;
