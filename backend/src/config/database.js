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
const dbSsl = process.env.DB_SSL === "true";

const sslConfig = dbSsl
  ? {
      ssl: true,
      dialectOptions: {
        ssl: {
          require: true,
          rejectUnauthorized: false,
        },
      },
    }
  : {};

const sequelize = databaseUrl
  ? new Sequelize(databaseUrl, {
      dialect: "postgres",
      logging,
      ...sslConfig,
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
        ...sslConfig,
      },
    );

export default sequelize;
