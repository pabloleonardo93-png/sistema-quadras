require("./env.cjs");

function env(...nomes) {
  for (const nome of nomes) {
    if (process.env[nome]) {
      return process.env[nome];
    }
  }
  return undefined;
}

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

const configuracao = {
  ...(databaseUrl ? { use_env_variable: "DATABASE_URL" } : {
    username: env("DB_USER", "DB_USERNAME", "POSTGRES_USER"),
    password: env("DB_PASSWORD", "POSTGRES_PASSWORD"),
    database: env("DB_NAME", "DB_DATABASE", "POSTGRES_DB"),
    host: env("DB_HOST", "POSTGRES_HOST") || "database",
    port: Number(env("DB_PORT", "POSTGRES_PORT") || 5432),
  }),
  dialect: "postgres",
  logging: false,
  ...sslConfig,
};

module.exports = {
  development: configuracao,
  test: configuracao,
  production: configuracao,
};
