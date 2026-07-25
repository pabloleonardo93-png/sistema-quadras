import "./config/env.js";
import path from "node:path";
import cors from "cors";
import express from "express";
import helmet from "helmet";
import { diretorioUploads } from "./modules/arquivos/arquivo.upload.js";
import { rotaNaoEncontrada, tratarErro } from "./middlewares/errorMiddleware.js";
import "./models/index.js";
import routes from "./routes/index.js";
import { criarCorsOptions } from "./config/cors.js";

const app = express();

function obterTrustProxy() {
  const valor = String(process.env.TRUST_PROXY || "").trim().toLowerCase();
  if (!valor || valor === "false" || valor === "0") return false;
  if (valor === "true") return true;
  if (/^\d+$/.test(valor)) return Number(valor);
  throw new Error("TRUST_PROXY deve ser false, true ou a quantidade de proxies confiaveis.");
}

app.set("trust proxy", obterTrustProxy());
app.disable("x-powered-by");
app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));
app.use((req, res, next) => cors(criarCorsOptions(req))(req, res, next));
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: false, limit: "1mb" }));
app.use("/uploads", express.static(path.resolve(diretorioUploads), { dotfiles: "deny", index: false }));
app.get("/api/health", (_req, res) => res.json({ status: "ok", mensagem: "API funcionando corretamente." }));
app.use("/api", routes);
app.use(rotaNaoEncontrada);
app.use(tratarErro);

export default app;
