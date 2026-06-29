require("dotenv").config();
const bcrypt = require("bcrypt");
const { QueryTypes } = require("sequelize");

const modalidadesIniciais = [
  {
    nome: "Beach Tennis",
    descricao: "Jogo rapido na areia, ideal para duplas e partidas dinamicas.",
  },
  {
    nome: "Futev\u00f4lei",
    descricao: "Controle, impulsao e tecnica para jogos de alto ritmo.",
  },
  {
    nome: "V\u00f4lei de Areia",
    descricao: "Quadras preparadas para treinos, amistosos e jogos em equipe.",
  },
];

const quadrasIniciais = [
  {
    nome: "Onda 01",
    descricao: "Quadra central",
    valor_hora: 90,
    imagem_url: "https://shoppingdabahia.com.br/data/files/30/55/50/F1/AA2138103A760038180808FF/FPD%20ARENA%20N6%20_1_.png",
  },
  {
    nome: "Onda 02",
    descricao: "Quadra panoramica",
    valor_hora: 85,
    imagem_url: "https://shoppingdabahia.com.br/data/files/77/45/85/E1/AA2138103A760038180808FF/FPD%20ARENA%20N2%20_1_%20_1_.png",
  },
  {
    nome: "Onda 03",
    descricao: "Quadra de treino",
    valor_hora: 75,
    imagem_url: "https://shoppingdabahia.com.br/data/files/0E/45/BD/E1/AA2138103A760038180808FF/FPD%20ARENA%20N%20_1_.png",
  },
];

const comunicadosIniciais = [
  {
    titulo: "Agenda aberta para a semana",
    mensagem: "Reserve seu horario pelo site e confirme sua partida com a equipe da arena.",
    destaque: true,
  },
  {
    titulo: "Chegue 10 minutos antes",
    mensagem: "A tolerancia ajuda a manter a grade de jogos organizada para todos.",
    destaque: false,
  },
];

const nomesModalidades = modalidadesIniciais.map((modalidade) => modalidade.nome);
const nomesQuadras = quadrasIniciais.map((quadra) => quadra.nome);
const titulosComunicados = comunicadosIniciais.map((comunicado) => comunicado.titulo);

function dataFutura(dias) {
  const data = new Date();
  data.setDate(data.getDate() + dias);
  return data.toISOString().slice(0, 10);
}

async function existePorCampo(queryInterface, tabela, campo, valor) {
  const registros = await queryInterface.sequelize.query(
    `SELECT id FROM ${tabela} WHERE ${campo} = :valor LIMIT 1`,
    { replacements: { valor }, type: QueryTypes.SELECT },
  );
  return registros.length > 0;
}

async function criarAdministrador(queryInterface, agora) {
  const email = String(process.env.ADMIN_SEED_EMAIL || "admin@teste.com").trim().toLowerCase();
  const senha = process.env.ADMIN_SEED_PASSWORD;

  if (!senha) {
    throw new Error("ADMIN_SEED_PASSWORD precisa ser definida antes de executar o seeder.");
  }

  const existe = await existePorCampo(queryInterface, "administradores", "email", email);
  if (!existe) {
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
}

async function criarModalidades(queryInterface, agora) {
  for (const modalidade of modalidadesIniciais) {
    const existe = await existePorCampo(queryInterface, "modalidades", "nome", modalidade.nome);
    if (!existe) {
      await queryInterface.bulkInsert("modalidades", [{
        ...modalidade,
        status: "ativa",
        criado_em: agora,
        atualizado_em: agora,
      }]);
    }
  }
}

async function criarQuadras(queryInterface, agora) {
  for (const quadra of quadrasIniciais) {
    const existe = await existePorCampo(queryInterface, "quadras", "nome", quadra.nome);
    if (!existe) {
      await queryInterface.bulkInsert("quadras", [{
        ...quadra,
        status: "ativa",
        criado_em: agora,
        atualizado_em: agora,
      }]);
    }
  }
}

async function vincularQuadrasEModalidades(queryInterface) {
  const [quadras, modalidades] = await Promise.all([
    queryInterface.sequelize.query(
      "SELECT id FROM quadras WHERE status = 'ativa' AND nome IN (:nomes)",
      { replacements: { nomes: nomesQuadras }, type: QueryTypes.SELECT },
    ),
    queryInterface.sequelize.query(
      "SELECT id FROM modalidades WHERE status = 'ativa' AND nome IN (:nomes)",
      { replacements: { nomes: nomesModalidades }, type: QueryTypes.SELECT },
    ),
  ]);

  for (const quadra of quadras) {
    for (const modalidade of modalidades) {
      const vinculo = await queryInterface.sequelize.query(
        "SELECT quadra_id FROM quadras_modalidades WHERE quadra_id = :quadraId AND modalidade_id = :modalidadeId LIMIT 1",
        {
          replacements: { quadraId: quadra.id, modalidadeId: modalidade.id },
          type: QueryTypes.SELECT,
        },
      );

      if (vinculo.length === 0) {
        await queryInterface.bulkInsert("quadras_modalidades", [{
          quadra_id: quadra.id,
          modalidade_id: modalidade.id,
        }]);
      }
    }
  }
}

async function criarHorarios(queryInterface, agora) {
  const quadras = await queryInterface.sequelize.query(
    "SELECT id FROM quadras WHERE status = 'ativa' AND nome IN (:nomes)",
    { replacements: { nomes: nomesQuadras }, type: QueryTypes.SELECT },
  );
  const janelas = [
    ["07:00", "08:00"],
    ["08:00", "09:00"],
    ["18:00", "19:00"],
    ["19:00", "20:00"],
    ["20:00", "21:00"],
  ];

  for (const quadra of quadras) {
    for (let offset = 1; offset <= 7; offset += 1) {
      const data = dataFutura(offset);
      for (const [horaInicio, horaFim] of janelas) {
        const horarios = await queryInterface.sequelize.query(
          "SELECT id FROM horarios WHERE quadra_id = :quadraId AND data = :data AND hora_inicio = :horaInicio LIMIT 1",
          {
            replacements: { quadraId: quadra.id, data, horaInicio },
            type: QueryTypes.SELECT,
          },
        );

        if (horarios.length === 0) {
          await queryInterface.bulkInsert("horarios", [{
            quadra_id: quadra.id,
            data,
            hora_inicio: horaInicio,
            hora_fim: horaFim,
            status: "disponivel",
            criado_em: agora,
            atualizado_em: agora,
          }]);
        }
      }
    }
  }
}

async function criarComunicados(queryInterface, agora) {
  for (const comunicado of comunicadosIniciais) {
    const existe = await existePorCampo(queryInterface, "comunicados", "titulo", comunicado.titulo);
    if (!existe) {
      await queryInterface.bulkInsert("comunicados", [{
        ...comunicado,
        status: "publicado",
        publicado_em: agora,
        criado_em: agora,
        atualizado_em: agora,
      }]);
    }
  }
}

module.exports = {
  async up(queryInterface) {
    const agora = new Date();

    await criarAdministrador(queryInterface, agora);
    await criarModalidades(queryInterface, agora);
    await criarQuadras(queryInterface, agora);
    await vincularQuadrasEModalidades(queryInterface);
    await criarHorarios(queryInterface, agora);
    await criarComunicados(queryInterface, agora);
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete("comunicados", {
      titulo: titulosComunicados,
    });
    await queryInterface.sequelize.query(
      "DELETE FROM horarios WHERE quadra_id IN (SELECT id FROM quadras WHERE nome IN (:nomes))",
      { replacements: { nomes: nomesQuadras } },
    );
    await queryInterface.sequelize.query(
      "DELETE FROM quadras_modalidades WHERE quadra_id IN (SELECT id FROM quadras WHERE nome IN (:nomes))",
      { replacements: { nomes: nomesQuadras } },
    );
    await queryInterface.bulkDelete("quadras", {
      nome: nomesQuadras,
    });
    await queryInterface.bulkDelete("modalidades", {
      nome: nomesModalidades,
    });
    await queryInterface.bulkDelete("administradores", {
      email: String(process.env.ADMIN_SEED_EMAIL || "admin@teste.com").trim().toLowerCase(),
    });
  },
};
