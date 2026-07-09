import "./env.js";
import { Sequelize } from "sequelize";

function env(...nomes) {
  for (const nome of nomes) {
    if (process.env[nome]) {
      return process.env[nome];
    }
  }
  return undefined;
}

const logging = process.env.NODE_ENV === "development" && process.env.DB_LOGGING === "true" ? console.log : false;
const databaseUrl = env("DATABASE_URL");

const sequelize = databaseUrl
  ? new Sequelize(databaseUrl, {
      dialect: "postgres",
      logging,
    })
  : new Sequelize(
      env("DB_NAME", "DB_DATABASE", "POSTGRES_DB"),
      env("DB_USER", "DB_USERNAME", "POSTGRES_USER"),
      env("DB_PASSWORD", "POSTGRES_PASSWORD"),
      {
        host: env("DB_HOST", "POSTGRES_HOST") || "database",
        port: Number(env("DB_PORT", "POSTGRES_PORT") || 5432),
        dialect: "postgres",
        logging,
      },
    );

export default sequelize;
