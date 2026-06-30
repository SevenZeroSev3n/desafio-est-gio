import { describe, it, expect } from "vitest";
import Database from "better-sqlite3";
import { applySchema } from "./schema";
import { seedIfEmpty } from "./seed";
import { AccountService } from "../services/AccountService";

function freshDb() {
  const db = new Database(":memory:");
  applySchema(db);
  return db;
}

describe("seedIfEmpty", () => {
  it("cria a conta interna do gerente, escondida do cliente mas legível como carteira", () => {
    const db = freshDb();
    seedIfEmpty(db);
    const service = new AccountService(db);
    expect(service.listAccounts().some((a) => a.type === "manager")).toBe(false);
    expect(service.listTitulares().map((t) => t.nome)).not.toContain("Gerente");
    expect(service.getManagerWallet().type).toBe("manager");
  });

  it("é idempotente: chamar de novo num banco já populado não duplica o gerente", () => {
    const db = freshDb();
    seedIfEmpty(db);
    seedIfEmpty(db);
    const { c } = db.prepare("SELECT COUNT(*) AS c FROM accounts WHERE type = 'manager'").get() as { c: number };
    expect(c).toBe(1);
  });
});
