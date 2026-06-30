import { Router } from "express";
import { AccountService } from "../services/AccountService";

/**
 * Rotas da carteira interna do gerente (acumuladora de tarifas). Somente leitura
 * por enquanto — saída de fundos (payout/transferência) fica para outro incremento.
 */
export function createManagerRouter(service: AccountService): Router {
  const router = Router();

  // GET /manager — saldo acumulado de tarifas
  router.get("/", (_req, res) => {
    res.json(service.getManagerWallet());
  });

  // GET /manager/history — extrato das tarifas creditadas
  router.get("/history", (_req, res) => {
    res.json(service.managerHistory());
  });

  return router;
}
