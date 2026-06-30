import type Database from "better-sqlite3";

/**
 * Aplica o schema (idempotente) num banco já aberto. Fica separado de
 * `database.ts` — sem side-effect de import — para que os testes possam
 * montar um banco em memória isolado com o mesmo schema.
 */
export function applySchema(db: Database.Database): void {
  db.pragma("foreign_keys = ON");

  db.exec(`
    CREATE TABLE IF NOT EXISTS accounts (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      name       TEXT    NOT NULL,
      type       TEXT    NOT NULL CHECK (type IN ('checking', 'savings')),
      balance    INTEGER NOT NULL DEFAULT 0,        -- centavos
      created_at TEXT    NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS transactions (
      id            TEXT    PRIMARY KEY,
      account_id    INTEGER NOT NULL REFERENCES accounts(id),
      type          TEXT    NOT NULL CHECK (type IN ('withdraw', 'transfer_out', 'transfer_in')),
      amount        INTEGER NOT NULL,               -- centavos
      fee           INTEGER NOT NULL DEFAULT 0,     -- centavos
      balance_after INTEGER NOT NULL,               -- centavos
      created_at    TEXT    NOT NULL DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_tx_account ON transactions(account_id, created_at);
  `);
}
