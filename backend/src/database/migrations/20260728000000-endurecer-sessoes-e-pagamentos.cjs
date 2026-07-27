const { DataTypes } = require("sequelize");

module.exports = {
  async up(queryInterface) {
    await queryInterface.sequelize.query('ALTER TYPE "enum_verificacoes_email_status" ADD VALUE IF NOT EXISTS \'revogado\';');

    await queryInterface.addColumn("reservas", "pagamento_expira_em", { type: DataTypes.DATE, allowNull: true });
    await queryInterface.addColumn("reservas", "pagamento_tipo", { type: DataTypes.STRING(20), allowNull: true });
    await queryInterface.addColumn("reservas", "pagamento_tentativa", { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 });
    await queryInterface.addColumn("reservas", "pagamento_idempotencia_chave", { type: DataTypes.STRING(180), allowNull: true });
    await queryInterface.addColumn("reservas", "pix_copia_e_cola", { type: DataTypes.TEXT, allowNull: true });
    await queryInterface.addColumn("reservas", "pix_qr_code_base64", { type: DataTypes.TEXT, allowNull: true });
    await queryInterface.addIndex("reservas", ["pagamento_idempotencia_chave"], {
      name: "reservas_pagamento_idempotencia_unique",
      unique: true,
      where: { pagamento_idempotencia_chave: { [require("sequelize").Op.ne]: null } },
    });

    await queryInterface.createTable("limites_seguranca", {
      id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
      chave: { type: DataTypes.STRING(160), allowNull: false },
      inicio_janela: { type: DataTypes.DATE, allowNull: false },
      expira_em: { type: DataTypes.DATE, allowNull: false },
      quantidade: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
      criado_em: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
      atualizado_em: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    });
    await queryInterface.addIndex("limites_seguranca", ["chave", "inicio_janela"], {
      name: "limites_seguranca_chave_janela_unique",
      unique: true,
    });
    await queryInterface.addIndex("limites_seguranca", ["expira_em"], { name: "limites_seguranca_expira_idx" });
  },

  async down(queryInterface) {
    await queryInterface.dropTable("limites_seguranca");
    await queryInterface.removeIndex("reservas", "reservas_pagamento_idempotencia_unique");
    for (const coluna of ["pix_qr_code_base64", "pix_copia_e_cola", "pagamento_idempotencia_chave", "pagamento_tentativa", "pagamento_tipo", "pagamento_expira_em"]) {
      await queryInterface.removeColumn("reservas", coluna);
    }
  },
};
