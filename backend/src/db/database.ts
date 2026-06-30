import path from "path";
import Database from "better-sqlite3";
import { applySchema } from "./schema";

// Banco fica em backend/bank.db (fora de src). Singleton usado pela aplicação.
const dbPath = path.join(__dirname, "..", "..", "bank.db");
const db = new Database(dbPath);

db.pragma("journal_mode = WAL");
applySchema(db);

export default db;
