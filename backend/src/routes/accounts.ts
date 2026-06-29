import { Router } from "express";
import { AccountService } from "../services/AccountService";
import { AppError } from "../errors";
import { createAccountSchema, transferSchema, withdrawSchema } from "../validators/schemas";

const router = Router();
const service = new AccountService();

function parseId(raw: string): number {
  const id = Number(raw);
  if (!Number.isInteger(id) || id <= 0) {
    throw new AppError("id inválido", "INVALID_ID", 400);
  }
  return id;
}

// GET /accounts — lista todas as contas
router.get("/", (_req, res) => {
  res.json(service.listAccounts());
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

// POST /accounts — cria conta
router.post("/", (req, res) => {
  const { name, type, balance } = createAccountSchema.parse(req.body);
  res.status(201).json(service.createAccount(name, type, balance));
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

export default router;
