const { DataTypes } = require("sequelize");

module.exports = {
  async up(queryInterface) {
    await queryInterface.addColumn("reservas", "valor_total", {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0,
    });

    await queryInterface.addColumn("reservas", "pagamento_status", {
      type: DataTypes.ENUM("nao_iniciado", "pendente", "pago", "cancelado", "expirado", "falhou"),
      allowNull: false,
      defaultValue: "nao_iniciado",
    });

    await queryInterface.addColumn("reservas", "mercado_pago_preference_id", {
      type: DataTypes.STRING(120),
      allowNull: true,
    });

    await queryInterface.addColumn("reservas", "mercado_pago_payment_id", {
      type: DataTypes.STRING(120),
      allowNull: true,
    });

    await queryInterface.addColumn("reservas", "mercado_pago_status", {
      type: DataTypes.STRING(80),
      allowNull: true,
    });

    await queryInterface.addColumn("reservas", "mercado_pago_status_detail", {
      type: DataTypes.STRING(120),
      allowNull: true,
    });

    await queryInterface.addColumn("reservas", "pagamento_url", {
      type: DataTypes.STRING(800),
      allowNull: true,
    });

    await queryInterface.addColumn("reservas", "pagamento_criado_em", {
      type: DataTypes.DATE,
      allowNull: true,
    });

    await queryInterface.addColumn("reservas", "pago_em", {
      type: DataTypes.DATE,
      allowNull: true,
    });

    await queryInterface.sequelize.query(`
      UPDATE reservas
      SET valor_total = quadras.valor_hora
      FROM quadras
      WHERE reservas.quadra_id = quadras.id
        AND reservas.valor_total = 0
    `);
  },

  async down(queryInterface) {
    for (const coluna of [
      "pago_em",
      "pagamento_criado_em",
      "pagamento_url",
      "mercado_pago_status_detail",
      "mercado_pago_status",
      "mercado_pago_payment_id",
      "mercado_pago_preference_id",
      "pagamento_status",
      "valor_total",
    ]) {
      await queryInterface.removeColumn("reservas", coluna);
    }

    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_reservas_pagamento_status";');
  },
};
