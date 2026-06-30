import db from "./database";
import { toCents } from "../money";

/** Popula titulares e contas de exemplo na primeira execução. João tem os dois tipos. */
export function seedIfEmpty(): void {
  const { c } = db.prepare("SELECT COUNT(*) AS c FROM titulares").get() as { c: number };
  if (c > 0) return;

  const insTitular = db.prepare("INSERT INTO titulares (nome) VALUES (?)");
  const insAccount = db.prepare("INSERT INTO accounts (owner_id, type, balance) VALUES (?, ?, ?)");
  const seedAll = db.transaction(() => {
    const joao = Number(insTitular.run("João Silva").lastInsertRowid);
    const maria = Number(insTitular.run("Maria Souza").lastInsertRowid);
    const pedro = Number(insTitular.run("Pedro Costa").lastInsertRowid);

    insAccount.run(joao, "checking", toCents(1000));
    insAccount.run(joao, "savings", toCents(2000));
    insAccount.run(maria, "checking", toCents(500));
    insAccount.run(pedro, "savings", toCents(800));
  });
  seedAll();
}
