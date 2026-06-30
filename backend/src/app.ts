import express, { type ErrorRequestHandler } from "express";
import cors from "cors";
import { ZodError } from "zod";
import { AppError } from "./errors";
import accountsRouter from "./routes/accounts";
import titularesRouter from "./routes/titulares";

export function createApp() {
  const app = express();

  app.use(cors());
  app.use(express.json());

  app.get("/health", (_req, res) => res.json({ status: "ok" }));
  app.use("/api/v1/accounts", accountsRouter);
  app.use("/api/v1/titulares", titularesRouter);

  // 404 para rotas desconhecidas
  app.use((_req, res) => {
    res.status(404).json({ error: "Rota não encontrada", code: "NOT_FOUND" });
  });

  // Middleware central de erro: traduz AppError e ZodError para JSON consistente.
  const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
    if (err instanceof AppError) {
      return res.status(err.status).json({
        error: err.message,
        code: err.code,
        ...err.details,
      });
    }
    if (err instanceof ZodError) {
      return res.status(400).json({
        error: "Dados inválidos",
        code: "VALIDATION_ERROR",
        issues: err.issues.map((i) => ({ path: i.path.join("."), message: i.message })),
      });
    }
    console.error(err);
    return res.status(500).json({ error: "Erro interno", code: "INTERNAL_ERROR" });
  };
  app.use(errorHandler);

  return app;
}
