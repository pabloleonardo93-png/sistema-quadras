const { DataTypes } = require("sequelize");

module.exports = {
  async up(queryInterface) {
    await queryInterface.createTable("acessos_paginas", {
      id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
      pagina: { type: DataTypes.STRING(80), allowNull: false },
      visitante_id: { type: DataTypes.STRING(120), allowNull: false },
      caminho: { type: DataTypes.STRING(300), allowNull: true },
      origem: { type: DataTypes.STRING(500), allowNull: true },
      user_agent: { type: DataTypes.STRING(500), allowNull: true },
      endereco_ip: { type: DataTypes.STRING(80), allowNull: true },
      criado_em: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
      atualizado_em: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    });

    await queryInterface.addIndex("acessos_paginas", ["pagina"], {
      name: "acessos_paginas_pagina_idx",
    });
    await queryInterface.addIndex("acessos_paginas", ["pagina", "visitante_id"], {
      name: "acessos_paginas_pagina_visitante_idx",
    });
    await queryInterface.addIndex("acessos_paginas", ["criado_em"], {
      name: "acessos_paginas_criado_em_idx",
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable("acessos_paginas");
  },
};
