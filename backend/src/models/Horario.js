import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";
import { HORARIO_STATUS, HORARIO_STATUS_LISTA } from "../shared/constants/statusAdministrativos.js";
import { opcoesComuns } from "./opcoesComuns.js";

const Horario = sequelize.define("Horario", {
  quadraId: { type: DataTypes.INTEGER, allowNull: false, field: "quadra_id" },
  data: { type: DataTypes.DATEONLY, allowNull: false },
  horaInicio: { type: DataTypes.TIME, allowNull: false, field: "hora_inicio" },
  horaFim: { type: DataTypes.TIME, allowNull: false, field: "hora_fim" },
  status: { type: DataTypes.ENUM(...HORARIO_STATUS_LISTA), allowNull: false, defaultValue: HORARIO_STATUS.DISPONIVEL },
}, {
  ...opcoesComuns,
  tableName: "horarios",
  indexes: [{ name: "horarios_quadra_data_inicio_unique", unique: true, fields: ["quadra_id", "data", "hora_inicio"] }],
});

export default Horario;
