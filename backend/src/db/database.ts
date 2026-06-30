import path from "path";
import Database from "better-sqlite3";
import { applySchema } from "./schema";

// Banco fica em backend/bank.db (fora de src). DB_PATH permite apontar para outro
// arquivo (ex.: db isolado em smoke/CI). Singleton usado pela aplicação.
const dbPath = process.env.DB_PATH ?? path.join(__dirname, "..", "..", "bank.db");
const db = new Database(dbPath);

db.pragma("journal_mode = WAL");
applySchema(db);

export default db;
