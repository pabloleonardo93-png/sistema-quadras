require("../../config/env.cjs");
const bcrypt = require("bcrypt");
const { QueryTypes } = require("sequelize");
const {
  HORA_ABERTURA,
  HORA_FECHAMENTO,
  funcionaNaData,
} = require("../../shared/constants/funcionamento.cjs");

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
    nome: "Areia 01",
    descricao: "Quadra central",
    valor_hora: 90,
    imagem_url: "/images/quadras/areia-01.jpeg",
  },
  {
    nome: "Areia 02",
    descricao: "Quadra panoramica",
    valor_hora: 85,
    imagem_url: "/images/quadras/areia-02.jpeg",
  },
  {
    nome: "Areia 03",
    descricao: "Quadra de treino",
    valor_hora: 75,
    imagem_url: "/images/quadras/areia-03.webp",
  },
];

const comunicadosIniciais = [
  {
    titulo: "Agenda aberta para a semana",
    mensagem: "Reserve seu hor\u00e1rio pelo site e confirme sua partida com a equipe do complexo.",
    destaque: true,
  },
  {
    titulo: "Chegue 10 minutos antes",
    mensagem: "A toler\u00e2ncia ajuda a manter a grade de jogos organizada para todos.",
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

function datasFuturasPadrao() {
  const datas = [];
  for (let offset = 0; offset <= 60; offset += 1) {
    datas.push(dataFutura(offset));
  }
  return datas;
}

function janelasDeFuncionamento() {
  const janelas = [];
  for (let hora = Number(HORA_ABERTURA.slice(0, 2)); hora < Number(HORA_FECHAMENTO.slice(0, 2)); hora += 1) {
    const horaInicio = String(hora).padStart(2, "0") + ":00";
    const horaFim = String(hora + 1).padStart(2, "0") + ":00";
    janelas.push([horaInicio, horaFim]);
  }
  return janelas;
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
  const janelas = janelasDeFuncionamento();

  for (const quadra of quadras) {
    const datasExistentes = await queryInterface.sequelize.query(
      "SELECT DISTINCT data FROM horarios WHERE quadra_id = :quadraId",
      { replacements: { quadraId: quadra.id }, type: QueryTypes.SELECT },
    );
    const hoje = dataFutura(0);
    const datas = Array.from(new Set([
      ...datasFuturasPadrao(),
      ...datasExistentes.map((registro) => String(registro.data).slice(0, 10)),
    ]))
      .filter((data) => data >= hoje && funcionaNaData(data))
      .sort();

    for (const data of datas) {
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
    const comunicados = await queryInterface.sequelize.query(
      "SELECT id FROM comunicados WHERE titulo = :titulo LIMIT 1",
      { replacements: { titulo: comunicado.titulo }, type: QueryTypes.SELECT },
    );

    if (comunicados.length === 0) {
      await queryInterface.bulkInsert("comunicados", [{
        ...comunicado,
        status: "publicado",
        publicado_em: agora,
        criado_em: agora,
        atualizado_em: agora,
      }]);
    } else {
      await queryInterface.bulkUpdate("comunicados", {
        mensagem: comunicado.mensagem,
        destaque: comunicado.destaque,
        status: "publicado",
        atualizado_em: agora,
      }, { titulo: comunicado.titulo });
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
