import { DataTypes, Op } from "sequelize";
import sequelize from "../config/database.js";
import { PAGAMENTO_STATUS, PAGAMENTO_STATUS_LISTA } from "../shared/constants/pagamentoStatus.js";
import {
  RESERVA_STATUS,
  RESERVA_STATUS_LISTA,
  RESERVA_STATUS_SEM_CONFLITO_DE_HORARIO,
} from "../shared/constants/reservaStatus.js";
import { opcoesComuns } from "./opcoesComuns.js";

const Reserva = sequelize.define("Reserva", {
  clienteId: { type: DataTypes.INTEGER, allowNull: false, field: "cliente_id" },
  emailVerificacaoId: { type: DataTypes.INTEGER, allowNull: true, field: "email_verificacao_id" },
  quadraId: { type: DataTypes.INTEGER, allowNull: false, field: "quadra_id" },
  modalidadeId: { type: DataTypes.INTEGER, allowNull: false, field: "modalidade_id" },
  horarioId: { type: DataTypes.INTEGER, allowNull: false, field: "horario_id" },
  data: { type: DataTypes.DATEONLY, allowNull: false },
  horaInicio: { type: DataTypes.TIME, allowNull: false, field: "hora_inicio" },
  horaFim: { type: DataTypes.TIME, allowNull: false, field: "hora_fim" },
  status: {
    type: DataTypes.ENUM(...RESERVA_STATUS_LISTA),
    allowNull: false,
    defaultValue: RESERVA_STATUS.AGUARDANDO_PAGAMENTO,
  },
  valorTotal: { type: DataTypes.DECIMAL(10, 2), allowNull: false, defaultValue: 0, field: "valor_total" },
  pagamentoStatus: {
    type: DataTypes.ENUM(...PAGAMENTO_STATUS_LISTA),
    allowNull: false,
    defaultValue: PAGAMENTO_STATUS.PENDENTE,
    field: "pagamento_status",
  },
  mercadoPagoPreferenceId: { type: DataTypes.STRING(120), allowNull: true, field: "mercado_pago_preference_id" },
  mercadoPagoPaymentId: { type: DataTypes.STRING(120), allowNull: true, field: "mercado_pago_payment_id" },
  mercadoPagoStatus: { type: DataTypes.STRING(80), allowNull: true, field: "mercado_pago_status" },
  mercadoPagoStatusDetail: { type: DataTypes.STRING(120), allowNull: true, field: "mercado_pago_status_detail" },
  pagamentoUrl: { type: DataTypes.STRING(800), allowNull: true, field: "pagamento_url" },
  pagamentoCriadoEm: { type: DataTypes.DATE, allowNull: true, field: "pagamento_criado_em" },
  pagoEm: { type: DataTypes.DATE, allowNull: true, field: "pago_em" },
  observacoes: { type: DataTypes.TEXT, allowNull: true },
}, {
  ...opcoesComuns,
  tableName: "reservas",
  indexes: [{
    name: "reservas_quadra_horario_ativo_unique",
    unique: true,
    fields: ["quadra_id", "data", "hora_inicio"],
    where: { status: { [Op.notIn]: RESERVA_STATUS_SEM_CONFLITO_DE_HORARIO } },
  }],
});

export default Reserva;
