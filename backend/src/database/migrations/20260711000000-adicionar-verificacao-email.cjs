const { DataTypes } = require("sequelize");

const datas = {
  criado_em: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
  atualizado_em: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
};

module.exports = {
  async up(queryInterface) {
    await queryInterface.createTable("verificacoes_email", {
      id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
      email: { type: DataTypes.STRING(160), allowNull: false },
      codigo_hash: { type: DataTypes.STRING(128), allowNull: false },
      token_hash: { type: DataTypes.STRING(128), allowNull: true, unique: true },
      status: {
        type: DataTypes.ENUM("pendente", "validado", "expirado", "bloqueado"),
        allowNull: false,
        defaultValue: "pendente",
      },
      tentativas: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
      envios: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 1 },
      expira_em: { type: DataTypes.DATE, allowNull: false },
      reenvio_liberado_em: { type: DataTypes.DATE, allowNull: false },
      ultimo_envio_em: { type: DataTypes.DATE, allowNull: false },
      validado_em: { type: DataTypes.DATE, allowNull: true },
      token_expira_em: { type: DataTypes.DATE, allowNull: true },
      endereco_ip: { type: DataTypes.STRING(80), allowNull: true },
      user_agent: { type: DataTypes.STRING(255), allowNull: true },
      ...datas,
    });

    await queryInterface.addIndex("verificacoes_email", ["email", "status"], {
      name: "verificacoes_email_email_status_idx",
    });
    await queryInterface.addIndex("verificacoes_email", ["endereco_ip", "criado_em"], {
      name: "verificacoes_email_ip_criado_idx",
    });

    await queryInterface.addColumn("clientes", "email_verificado_em", {
      type: DataTypes.DATE,
      allowNull: true,
    });

    await queryInterface.addColumn("reservas", "email_verificacao_id", {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: { model: "verificacoes_email", key: "id" },
      onDelete: "SET NULL",
      onUpdate: "CASCADE",
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn("reservas", "email_verificacao_id");
    await queryInterface.removeColumn("clientes", "email_verificado_em");
    await queryInterface.dropTable("verificacoes_email");
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_verificacoes_email_status";');
  },
};
