import { Router } from "express";
import { AccountService } from "../services/AccountService";

/** Monta as rotas de /titulares sobre o service injetado. */
export function createTitularesRouter(service: AccountService): Router {
  const router = Router();

  // GET /titulares — lista os titulares (para o seletor de dono na criação de conta)
  router.get("/", (_req, res) => {
    res.json(service.listTitulares());
  });

  return router;
}
