require("dotenv").config();
const bcrypt = require("bcrypt");
const { QueryTypes } = require("sequelize");

module.exports = {
  async up(queryInterface) {
    const agora = new Date();
    const email = String(process.env.ADMIN_SEED_EMAIL || "admin@teste.com").trim().toLowerCase();
    const senha = process.env.ADMIN_SEED_PASSWORD;

    if (!senha) {
      throw new Error("ADMIN_SEED_PASSWORD precisa ser definida antes de executar o seeder.");
    }

    const administradores = await queryInterface.sequelize.query(
      "SELECT id FROM administradores WHERE email = :email LIMIT 1",
      { replacements: { email }, type: QueryTypes.SELECT },
    );

    if (administradores.length === 0) {
      await queryInterface.bulkInsert("administradores", [{
        nome: process.env.ADMIN_SEED_NAME || "Administrador Local",
        email,
        senha_hash: await bcrypt.hash(senha, 12),
        permissao: "administrador",
        status: "ativo",
        criado_em: agora,
        atualizado_em: agora,
      }]);
    }

    for (const nome of ["Beach Tennis", "Futevôlei", "Vôlei de Areia"]) {
      const existentes = await queryInterface.sequelize.query(
        "SELECT id FROM modalidades WHERE nome = :nome LIMIT 1",
        { replacements: { nome }, type: QueryTypes.SELECT },
      );
      if (existentes.length === 0) {
        await queryInterface.bulkInsert("modalidades", [{
          nome,
          descricao: null,
          status: "ativa",
          criado_em: agora,
          atualizado_em: agora,
        }]);
      }
    }
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete("modalidades", {
      nome: ["Beach Tennis", "Futevôlei", "Vôlei de Areia"],
    });
    await queryInterface.bulkDelete("administradores", {
      email: String(process.env.ADMIN_SEED_EMAIL || "admin@teste.com").trim().toLowerCase(),
    });
  },
};
