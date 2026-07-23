import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";
import { opcoesComuns } from "./opcoesComuns.js";

const AcessoPagina = sequelize.define("AcessoPagina", {
  pagina: { type: DataTypes.STRING(80), allowNull: false },
  visitanteId: { type: DataTypes.STRING(120), allowNull: false, field: "visitante_id" },
  caminho: { type: DataTypes.STRING(300), allowNull: true },
  origem: { type: DataTypes.STRING(500), allowNull: true },
  userAgent: { type: DataTypes.STRING(500), allowNull: true, field: "user_agent" },
  enderecoIp: { type: DataTypes.STRING(80), allowNull: true, field: "endereco_ip" },
}, { ...opcoesComuns, tableName: "acessos_paginas" });

export default AcessoPagina;
