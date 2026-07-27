import { DataTypes, Op } from "sequelize";
import sequelize from "../config/database.js";
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
    type: DataTypes.ENUM("aguardando_pagamento", "confirmada", "cancelada", "expirada", "finalizada"),
    allowNull: false,
    defaultValue: "aguardando_pagamento",
  },
  valorTotal: { type: DataTypes.DECIMAL(10, 2), allowNull: false, defaultValue: 0, field: "valor_total" },
  pagamentoStatus: {
    type: DataTypes.ENUM("pendente", "aprovado", "recusado", "cancelado", "estornado"),
    allowNull: false,
    defaultValue: "pendente",
    field: "pagamento_status",
  },
  mercadoPagoPreferenceId: { type: DataTypes.STRING(120), allowNull: true, field: "mercado_pago_preference_id" },
  mercadoPagoPaymentId: { type: DataTypes.STRING(120), allowNull: true, field: "mercado_pago_payment_id" },
  mercadoPagoStatus: { type: DataTypes.STRING(80), allowNull: true, field: "mercado_pago_status" },
  mercadoPagoStatusDetail: { type: DataTypes.STRING(120), allowNull: true, field: "mercado_pago_status_detail" },
  pagamentoUrl: { type: DataTypes.STRING(800), allowNull: true, field: "pagamento_url" },
  pagamentoCriadoEm: { type: DataTypes.DATE, allowNull: true, field: "pagamento_criado_em" },
  pagamentoExpiraEm: { type: DataTypes.DATE, allowNull: true, field: "pagamento_expira_em" },
  pagamentoTipo: { type: DataTypes.STRING(20), allowNull: true, field: "pagamento_tipo" },
  pagamentoTentativa: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0, field: "pagamento_tentativa" },
  pagamentoIdempotenciaChave: { type: DataTypes.STRING(180), allowNull: true, unique: true, field: "pagamento_idempotencia_chave" },
  pixCopiaECola: { type: DataTypes.TEXT, allowNull: true, field: "pix_copia_e_cola" },
  pixQrCodeBase64: { type: DataTypes.TEXT, allowNull: true, field: "pix_qr_code_base64" },
  pagoEm: { type: DataTypes.DATE, allowNull: true, field: "pago_em" },
  observacoes: { type: DataTypes.TEXT, allowNull: true },
}, {
  ...opcoesComuns,
  tableName: "reservas",
  indexes: [{
    name: "reservas_quadra_horario_ativo_unique",
    unique: true,
    fields: ["quadra_id", "data", "hora_inicio"],
    where: { status: { [Op.notIn]: ["cancelada", "expirada"] } },
  }],
});

export default Reserva;
