import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";
import { opcoesComuns } from "./opcoesComuns.js";

const Horario = sequelize.define("Horario", {
  quadraId: { type: DataTypes.INTEGER, allowNull: false, field: "quadra_id" },
  data: { type: DataTypes.DATEONLY, allowNull: false },
  horaInicio: { type: DataTypes.TIME, allowNull: false, field: "hora_inicio" },
  horaFim: { type: DataTypes.TIME, allowNull: false, field: "hora_fim" },
  status: { type: DataTypes.ENUM("disponivel", "reservado", "bloqueado"), allowNull: false, defaultValue: "disponivel" },
}, {
  ...opcoesComuns,
  tableName: "horarios",
  indexes: [{ name: "horarios_quadra_data_inicio_unique", unique: true, fields: ["quadra_id", "data", "hora_inicio"] }],
});

export default Horario;
