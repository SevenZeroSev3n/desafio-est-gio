import Database from "better-sqlite3";
import { applySchema } from "../db/schema";
import { toCents } from "../money";
import type { AccountType } from "../types";

export interface AccountSeed {
  name: string;
  type: AccountType;
  balance: number;
}

/**
 * Banco SQLite `:memory:` isolado com o schema aplicado e as contas dadas como
 * fixtures (cada uma com seu próprio titular). Retorna o banco e os ids das contas.
 */
export function makeTestDb(accounts: AccountSeed[] = []) {
  const db = new Database(":memory:");
  applySchema(db);
  const insTitular = db.prepare("INSERT INTO titulares (nome) VALUES (?)");
  const insAccount = db.prepare("INSERT INTO accounts (owner_id, type, balance) VALUES (?, ?, ?)");
  const ids = accounts.map((a) => {
    const ownerId = Number(insTitular.run(a.name).lastInsertRowid);
    return Number(insAccount.run(ownerId, a.type, toCents(a.balance)).lastInsertRowid);
  });
  return { db, ids };
}
