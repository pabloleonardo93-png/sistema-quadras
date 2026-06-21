const { DataTypes, Op } = require("sequelize");

const datas = {
  criado_em: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
  atualizado_em: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
};

module.exports = {
  async up(queryInterface) {
    await queryInterface.createTable("administradores", {
      id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
      nome: { type: DataTypes.STRING(120), allowNull: false },
      email: { type: DataTypes.STRING(160), allowNull: false, unique: true },
      senha_hash: { type: DataTypes.STRING(255), allowNull: false },
      permissao: { type: DataTypes.ENUM("administrador", "gerente"), allowNull: false, defaultValue: "administrador" },
      status: { type: DataTypes.ENUM("ativo", "inativo"), allowNull: false, defaultValue: "ativo" },
      ...datas,
    });

    await queryInterface.createTable("clientes", {
      id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
      nome: { type: DataTypes.STRING(120), allowNull: false },
      telefone: { type: DataTypes.STRING(30), allowNull: false },
      email: { type: DataTypes.STRING(160), allowNull: false, unique: true },
      status: { type: DataTypes.ENUM("ativo", "inativo"), allowNull: false, defaultValue: "ativo" },
      ...datas,
    });

    await queryInterface.createTable("quadras", {
      id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
      nome: { type: DataTypes.STRING(100), allowNull: false, unique: true },
      descricao: { type: DataTypes.TEXT, allowNull: true },
      valor_hora: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
      status: { type: DataTypes.ENUM("ativa", "manutencao", "inativa"), allowNull: false, defaultValue: "ativa" },
      imagem_url: { type: DataTypes.STRING(500), allowNull: true },
      ...datas,
    });

    await queryInterface.createTable("modalidades", {
      id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
      nome: { type: DataTypes.STRING(100), allowNull: false, unique: true },
      descricao: { type: DataTypes.TEXT, allowNull: true },
      status: { type: DataTypes.ENUM("ativa", "inativa"), allowNull: false, defaultValue: "ativa" },
      ...datas,
    });

    await queryInterface.createTable("quadras_modalidades", {
      quadra_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true,
        references: { model: "quadras", key: "id" },
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
      },
      modalidade_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true,
        references: { model: "modalidades", key: "id" },
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
      },
    });

    await queryInterface.createTable("horarios", {
      id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
      quadra_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: "quadras", key: "id" },
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
      },
      data: { type: DataTypes.DATEONLY, allowNull: false },
      hora_inicio: { type: DataTypes.TIME, allowNull: false },
      hora_fim: { type: DataTypes.TIME, allowNull: false },
      status: { type: DataTypes.ENUM("disponivel", "reservado", "bloqueado"), allowNull: false, defaultValue: "disponivel" },
      ...datas,
    });
    await queryInterface.addIndex("horarios", ["quadra_id", "data", "hora_inicio"], {
      name: "horarios_quadra_data_inicio_unique",
      unique: true,
    });

    await queryInterface.createTable("reservas", {
      id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
      cliente_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: "clientes", key: "id" },
        onDelete: "RESTRICT",
        onUpdate: "CASCADE",
      },
      quadra_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: "quadras", key: "id" },
        onDelete: "RESTRICT",
        onUpdate: "CASCADE",
      },
      modalidade_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: "modalidades", key: "id" },
        onDelete: "RESTRICT",
        onUpdate: "CASCADE",
      },
      horario_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: "horarios", key: "id" },
        onDelete: "RESTRICT",
        onUpdate: "CASCADE",
      },
      data: { type: DataTypes.DATEONLY, allowNull: false },
      hora_inicio: { type: DataTypes.TIME, allowNull: false },
      hora_fim: { type: DataTypes.TIME, allowNull: false },
      status: { type: DataTypes.ENUM("pendente", "confirmada", "cancelada", "finalizada"), allowNull: false, defaultValue: "pendente" },
      observacoes: { type: DataTypes.TEXT, allowNull: true },
      ...datas,
    });
    await queryInterface.addIndex("reservas", ["quadra_id", "data", "hora_inicio"], {
      name: "reservas_quadra_horario_ativo_unique",
      unique: true,
      where: { status: { [Op.ne]: "cancelada" } },
    });

    await queryInterface.createTable("comunicados", {
      id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
      titulo: { type: DataTypes.STRING(180), allowNull: false },
      mensagem: { type: DataTypes.TEXT, allowNull: false },
      status: { type: DataTypes.ENUM("rascunho", "publicado", "arquivado"), allowNull: false, defaultValue: "rascunho" },
      destaque: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
      publicado_em: { type: DataTypes.DATE, allowNull: true },
      ...datas,
    });

    await queryInterface.createTable("arquivos", {
      id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
      admin_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: { model: "administradores", key: "id" },
        onDelete: "SET NULL",
        onUpdate: "CASCADE",
      },
      nome_original: { type: DataTypes.STRING(255), allowNull: false },
      nome_armazenado: { type: DataTypes.STRING(255), allowNull: false, unique: true },
      tipo_mime: { type: DataTypes.STRING(100), allowNull: false },
      tamanho: { type: DataTypes.INTEGER, allowNull: false },
      caminho: { type: DataTypes.STRING(500), allowNull: false },
      entidade: { type: DataTypes.STRING(80), allowNull: true },
      entidade_id: { type: DataTypes.INTEGER, allowNull: true },
      ...datas,
    });

    await queryInterface.createTable("logs_sistema", {
      id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
      admin_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: { model: "administradores", key: "id" },
        onDelete: "SET NULL",
        onUpdate: "CASCADE",
      },
      acao: { type: DataTypes.STRING(120), allowNull: false },
      entidade: { type: DataTypes.STRING(80), allowNull: true },
      entidade_id: { type: DataTypes.INTEGER, allowNull: true },
      endereco_ip: { type: DataTypes.STRING(80), allowNull: true },
      detalhes: { type: DataTypes.JSONB, allowNull: true },
      ...datas,
    });
  },

  async down(queryInterface) {
    for (const tabela of [
      "logs_sistema",
      "arquivos",
      "comunicados",
      "reservas",
      "horarios",
      "quadras_modalidades",
      "modalidades",
      "quadras",
      "clientes",
      "administradores",
    ]) {
      await queryInterface.dropTable(tabela);
    }

    for (const tipo of [
      "enum_administradores_permissao",
      "enum_administradores_status",
      "enum_clientes_status",
      "enum_quadras_status",
      "enum_modalidades_status",
      "enum_horarios_status",
      "enum_reservas_status",
      "enum_comunicados_status",
    ]) {
      await queryInterface.sequelize.query("DROP TYPE IF EXISTS \"" + tipo + "\";");
    }
  },
};
