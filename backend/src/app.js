import "dotenv/config";
import path from "node:path";
import cors from "cors";
import express from "express";
import helmet from "helmet";
import { diretorioUploads } from "./middlewares/uploadMiddleware.js";
import { rotaNaoEncontrada, tratarErro } from "./middlewares/errorMiddleware.js";
import "./models/index.js";
import routes from "./routes/index.js";
import ErroDaAplicacao from "./utils/ErroDaAplicacao.js";

const origensPermitidas = String(process.env.CORS_ORIGIN || "http://localhost:5173")
  .split(",")
  .map((origem) => origem.trim())
  .filter(Boolean);

const app = express();
app.disable("x-powered-by");
app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));
app.use(cors({
  origin(origem, callback) {
    if (!origem || origensPermitidas.includes(origem)) return callback(null, true);
    callback(new ErroDaAplicacao("Origem não permitida pelo CORS.", 403));
  },
}));
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: false, limit: "1mb" }));
app.use("/uploads", express.static(path.resolve(diretorioUploads), { dotfiles: "deny", index: false }));
app.get("/api/health", (_req, res) => res.json({ status: "ok", mensagem: "API funcionando corretamente." }));
app.use("/api", routes);
app.use(rotaNaoEncontrada);
app.use(tratarErro);

export default app;
