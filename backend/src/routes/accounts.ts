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

/**
 * A conta do gerente é interna e intocável pelo cliente. Tratamos o id dela como
 * inexistente (404 ACCOUNT_NOT_FOUND) — indistinguível de um id qualquer que não
 * existe — para não confirmar a sua existência a quem sonda ids.
 */
function rejectIfManager(service: AccountService, id: number): void {
  if (service.isManager(id)) {
    throw new AppError("Conta não encontrada", "ACCOUNT_NOT_FOUND", 404);
  }
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
    rejectIfManager(service, from_id);
    rejectIfManager(service, to_id);
    res.json(service.transfer(from_id, to_id, amount));
  });

  // GET /accounts/:id — detalhe de uma conta
  router.get("/:id", (req, res) => {
    const id = parseId(req.params.id);
    rejectIfManager(service, id);
    res.json(service.getAccount(id));
  });

  // POST /accounts/:id/withdraw — saque
  router.post("/:id/withdraw", (req, res) => {
    const id = parseId(req.params.id);
    const { amount } = withdrawSchema.parse(req.body);
    rejectIfManager(service, id);
    res.json(service.withdraw(id, amount));
  });

  // GET /accounts/:id/history — histórico de transações
  router.get("/:id/history", (req, res) => {
    const id = parseId(req.params.id);
    rejectIfManager(service, id);
    res.json(service.history(id));
  });

  return router;
}
