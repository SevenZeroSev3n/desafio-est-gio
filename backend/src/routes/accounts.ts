import { Router } from "express";
import { AccountService } from "../services/AccountService";
import { AppError } from "../errors";
import { createAccountSchema, transferSchema, withdrawSchema } from "../validators/schemas";

function parseId(raw: string): number {
  const id = Number(raw);
  if (!Number.isInteger(id) || id <= 0) {
    throw new AppError("id inválido", "INVALID_ID", 400);
  }
  return id;
}

/** Monta as rotas de /accounts sobre o service injetado (db real na app, :memory: nos testes). */
export function createAccountsRouter(service: AccountService): Router {
  const router = Router();

  // GET /accounts — lista todas as contas
  router.get("/", (_req, res) => {
    res.json(service.listAccounts());
  });

  // POST /accounts — cria uma conta (Zod valida shape; regra saldo>=0 e owner vivem no service)
  router.post("/", (req, res) => {
    const { type, balance, owner_id, owner_name } = createAccountSchema.parse(req.body);
    const owner = owner_id !== undefined ? { id: owner_id } : { name: owner_name! };
    res.status(201).json(service.createAccount(type, balance, owner));
  });

  // POST /accounts/transfer — transferência (definida antes de /:id para não colidir)
  router.post("/transfer", (req, res) => {
    const { from_id, to_id, amount } = transferSchema.parse(req.body);
    res.json(service.transfer(from_id, to_id, amount));
  });

  // GET /accounts/:id — detalhe de uma conta
  router.get("/:id", (req, res) => {
    res.json(service.getAccount(parseId(req.params.id)));
  });

  // POST /accounts/:id/withdraw — saque
  router.post("/:id/withdraw", (req, res) => {
    const { amount } = withdrawSchema.parse(req.body);
    res.json(service.withdraw(parseId(req.params.id), amount));
  });

  // GET /accounts/:id/history — histórico de transações
  router.get("/:id/history", (req, res) => {
    res.json(service.history(parseId(req.params.id)));
  });

  return router;
}
