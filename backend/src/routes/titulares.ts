import { Router } from "express";
import db from "../db/database";
import { AccountService } from "../services/AccountService";

const router = Router();
const service = new AccountService(db);

// GET /titulares — lista os titulares (para o seletor de dono na criação de conta)
router.get("/", (_req, res) => {
  res.json(service.listTitulares());
});

export default router;
