import { DataTypes, Op } from "sequelize";
import sequelize from "../config/database.js";
import { opcoesComuns } from "./opcoesComuns.js";

const Reserva = sequelize.define("Reserva", {
  clienteId: { type: DataTypes.INTEGER, allowNull: false, field: "cliente_id" },
  quadraId: { type: DataTypes.INTEGER, allowNull: false, field: "quadra_id" },
  modalidadeId: { type: DataTypes.INTEGER, allowNull: false, field: "modalidade_id" },
  horarioId: { type: DataTypes.INTEGER, allowNull: false, field: "horario_id" },
  data: { type: DataTypes.DATEONLY, allowNull: false },
  horaInicio: { type: DataTypes.TIME, allowNull: false, field: "hora_inicio" },
  horaFim: { type: DataTypes.TIME, allowNull: false, field: "hora_fim" },
  status: { type: DataTypes.ENUM("pendente", "confirmada", "cancelada", "finalizada"), allowNull: false, defaultValue: "pendente" },
  observacoes: { type: DataTypes.TEXT, allowNull: true },
}, {
  ...opcoesComuns,
  tableName: "reservas",
  indexes: [{
    name: "reservas_quadra_horario_ativo_unique",
    unique: true,
    fields: ["quadra_id", "data", "hora_inicio"],
    where: { status: { [Op.ne]: "cancelada" } },
  }],
});

export default Reserva;
