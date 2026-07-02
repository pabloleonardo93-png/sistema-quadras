const { Op } = require("sequelize");

async function removerIndiceSeExistir(queryInterface, tabela, indice) {
  try {
    await queryInterface.removeIndex(tabela, indice);
  } catch {
    // O indice pode nao existir em bancos criados parcialmente durante desenvolvimento.
  }
}

module.exports = {
  async up(queryInterface) {
    await queryInterface.sequelize.query('ALTER TYPE "enum_reservas_status" ADD VALUE IF NOT EXISTS \'aguardando_pagamento\';');
    await queryInterface.sequelize.query('ALTER TYPE "enum_reservas_status" ADD VALUE IF NOT EXISTS \'expirada\';');
    await queryInterface.sequelize.query('ALTER TYPE "enum_reservas_pagamento_status" ADD VALUE IF NOT EXISTS \'aprovado\';');
    await queryInterface.sequelize.query('ALTER TYPE "enum_reservas_pagamento_status" ADD VALUE IF NOT EXISTS \'recusado\';');
    await queryInterface.sequelize.query('ALTER TYPE "enum_reservas_pagamento_status" ADD VALUE IF NOT EXISTS \'estornado\';');

    await queryInterface.sequelize.query("ALTER TABLE reservas ALTER COLUMN status SET DEFAULT 'aguardando_pagamento';");
    await queryInterface.sequelize.query("ALTER TABLE reservas ALTER COLUMN pagamento_status SET DEFAULT 'pendente';");

    await queryInterface.sequelize.query("UPDATE reservas SET status = 'aguardando_pagamento' WHERE status = 'pendente';");
    await queryInterface.sequelize.query("UPDATE reservas SET status = 'expirada' WHERE status = 'cancelada' AND pagamento_status = 'expirado';");
    await queryInterface.sequelize.query("UPDATE reservas SET pagamento_status = 'aprovado' WHERE pagamento_status = 'pago';");
    await queryInterface.sequelize.query("UPDATE reservas SET pagamento_status = 'recusado' WHERE pagamento_status = 'falhou';");
    await queryInterface.sequelize.query("UPDATE reservas SET pagamento_status = 'cancelado' WHERE pagamento_status = 'expirado';");
    await queryInterface.sequelize.query("UPDATE reservas SET pagamento_status = 'pendente' WHERE pagamento_status = 'nao_iniciado';");

    await removerIndiceSeExistir(queryInterface, "reservas", "reservas_quadra_horario_ativo_unique");
    await queryInterface.addIndex("reservas", ["quadra_id", "data", "hora_inicio"], {
      name: "reservas_quadra_horario_ativo_unique",
      unique: true,
      where: { status: { [Op.notIn]: ["cancelada", "expirada"] } },
    });
  },

  async down(queryInterface) {
    await queryInterface.sequelize.query("ALTER TABLE reservas ALTER COLUMN status SET DEFAULT 'pendente';");
    await queryInterface.sequelize.query("ALTER TABLE reservas ALTER COLUMN pagamento_status SET DEFAULT 'nao_iniciado';");

    await queryInterface.sequelize.query("UPDATE reservas SET pagamento_status = 'pago' WHERE pagamento_status = 'aprovado';");
    await queryInterface.sequelize.query("UPDATE reservas SET pagamento_status = 'falhou' WHERE pagamento_status = 'recusado';");
    await queryInterface.sequelize.query("UPDATE reservas SET pagamento_status = 'cancelado' WHERE pagamento_status = 'estornado';");
    await queryInterface.sequelize.query("UPDATE reservas SET status = 'pendente' WHERE status = 'aguardando_pagamento';");
    await queryInterface.sequelize.query("UPDATE reservas SET status = 'cancelada' WHERE status = 'expirada';");

    await removerIndiceSeExistir(queryInterface, "reservas", "reservas_quadra_horario_ativo_unique");
    await queryInterface.addIndex("reservas", ["quadra_id", "data", "hora_inicio"], {
      name: "reservas_quadra_horario_ativo_unique",
      unique: true,
      where: { status: { [Op.ne]: "cancelada" } },
    });
  },
};
