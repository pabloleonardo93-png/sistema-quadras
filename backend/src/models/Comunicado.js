import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";
import { opcoesComuns } from "./opcoesComuns.js";

const Comunicado = sequelize.define("Comunicado", {
  titulo: { type: DataTypes.STRING(180), allowNull: false },
  mensagem: { type: DataTypes.TEXT, allowNull: false },
  status: { type: DataTypes.ENUM("rascunho", "publicado", "arquivado"), allowNull: false, defaultValue: "rascunho" },
  destaque: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
  publicadoEm: { type: DataTypes.DATE, allowNull: true, field: "publicado_em" },
}, { ...opcoesComuns, tableName: "comunicados" });

export default Comunicado;
