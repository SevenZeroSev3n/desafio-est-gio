import express, { type ErrorRequestHandler } from "express";
import cors from "cors";
import type Database from "better-sqlite3";
import { ZodError } from "zod";
import { AppError } from "./errors";
import { AccountService } from "./services/AccountService";
import { createAccountsRouter } from "./routes/accounts";
import { createTitularesRouter } from "./routes/titulares";
import { createManagerRouter } from "./routes/manager";

export function createApp(db: Database.Database) {
  const app = express();
  const service = new AccountService(db);

  app.use(cors());
  app.use(express.json());

  app.get("/health", (_req, res) => res.json({ status: "ok" }));
  app.use("/api/v1/accounts", createAccountsRouter(service));
  app.use("/api/v1/titulares", createTitularesRouter(service));
  app.use("/api/v1/manager", createManagerRouter(service));

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
