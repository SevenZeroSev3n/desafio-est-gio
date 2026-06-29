import path from "path";
import Database from "better-sqlite3";

// Banco fica em backend/bank.db (fora de src). Reinicializa schema de forma idempotente.
const dbPath = path.join(__dirname, "..", "..", "bank.db");
const db = new Database(dbPath);

db.pragma("journal_mode = WAL");
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

export default db;
