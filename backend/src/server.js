import "dotenv/config";
import app from "./app.js";
import sequelize from "./config/database.js";

const porta = Number(process.env.PORT || 3000);

async function iniciarServidor() {
  try {
    if (!process.env.JWT_SECRET) {
      throw new Error("JWT_SECRET não foi configurada.");
    }
    await sequelize.authenticate();
    app.listen(porta, () => {
      console.log("API disponível em http://localhost:" + porta);
    });
  } catch (erro) {
    console.error("Não foi possível iniciar o servidor:", erro.message);
    process.exit(1);
  }
}

iniciarServidor();
