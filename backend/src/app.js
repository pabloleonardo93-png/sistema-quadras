import "./config/env.js";
import path from "node:path";
import cors from "cors";
import express from "express";
import helmet from "helmet";
import { diretorioUploads } from "./middlewares/uploadMiddleware.js";
import { rotaNaoEncontrada, tratarErro } from "./middlewares/errorMiddleware.js";
import "./models/index.js";
import routes from "./routes/index.js";
import { criarCorsOptions } from "./config/cors.js";
import { trustProxyHops } from "./config/proxy.js";

const app = express();
app.disable("x-powered-by");
app.set("trust proxy", trustProxyHops);
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
