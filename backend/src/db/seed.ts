import db from "./database";
import { toCents } from "../money";

/** Popula 3 contas de exemplo na primeira execução. */
export function seedIfEmpty(): void {
  const { c } = db.prepare("SELECT COUNT(*) AS c FROM accounts").get() as { c: number };
  if (c > 0) return;

  const insert = db.prepare(
    "INSERT INTO accounts (name, type, balance) VALUES (?, ?, ?)",
  );
  const seedAll = db.transaction(() => {
    insert.run("João Silva", "checking", toCents(1000));
    insert.run("Maria Souza", "checking", toCents(500));
    insert.run("Pedro Costa", "savings", toCents(800));
  });
  seedAll();
}
