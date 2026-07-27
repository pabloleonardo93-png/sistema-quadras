import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";
import { opcoesComuns } from "./opcoesComuns.js";

const VerificacaoEmail = sequelize.define("VerificacaoEmail", {
  email: { type: DataTypes.STRING(160), allowNull: false, validate: { isEmail: true } },
  codigoHash: { type: DataTypes.STRING(128), allowNull: false, field: "codigo_hash" },
  tokenHash: { type: DataTypes.STRING(128), allowNull: true, unique: true, field: "token_hash" },
  status: {
    type: DataTypes.ENUM("pendente", "validado", "expirado", "bloqueado", "revogado"),
    allowNull: false,
    defaultValue: "pendente",
  },
  tentativas: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
  envios: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 1 },
  expiraEm: { type: DataTypes.DATE, allowNull: false, field: "expira_em" },
  reenvioLiberadoEm: { type: DataTypes.DATE, allowNull: false, field: "reenvio_liberado_em" },
  ultimoEnvioEm: { type: DataTypes.DATE, allowNull: false, field: "ultimo_envio_em" },
  validadoEm: { type: DataTypes.DATE, allowNull: true, field: "validado_em" },
  tokenExpiraEm: { type: DataTypes.DATE, allowNull: true, field: "token_expira_em" },
  enderecoIp: { type: DataTypes.STRING(80), allowNull: true, field: "endereco_ip" },
  userAgent: { type: DataTypes.STRING(255), allowNull: true, field: "user_agent" },
}, { ...opcoesComuns, tableName: "verificacoes_email" });

export default VerificacaoEmail;
