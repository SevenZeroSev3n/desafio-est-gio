import type Database from "better-sqlite3";
import defaultDb from "./database";
import { toCents } from "../money";

/**
 * Popula titulares e contas de exemplo na primeira execução. João tem os dois
 * tipos. Cria também a conta interna do gerente (acumuladora de tarifas).
 * Recebe o banco por injeção (default: singleton da app) para ser testável
 * sobre um `:memory:` sem tocar no bank.db de desenvolvimento.
 */
export function seedIfEmpty(database: Database.Database = defaultDb): void {
  const { c } = database.prepare("SELECT COUNT(*) AS c FROM titulares").get() as { c: number };
  if (c > 0) return;

  const insTitular = database.prepare("INSERT INTO titulares (nome) VALUES (?)");
  const insAccount = database.prepare("INSERT INTO accounts (owner_id, type, balance) VALUES (?, ?, ?)");
  const seedAll = database.transaction(() => {
    const joao = Number(insTitular.run("João Silva").lastInsertRowid);
    const maria = Number(insTitular.run("Maria Souza").lastInsertRowid);
    const pedro = Number(insTitular.run("Pedro Costa").lastInsertRowid);

    insAccount.run(joao, "checking", toCents(1000));
    insAccount.run(joao, "savings", toCents(2000));
    insAccount.run(maria, "checking", toCents(500));
    insAccount.run(pedro, "savings", toCents(800));

    // Conta interna do gerente: acumula as tarifas das correntes. Nasce zerada
    // e fica escondida das listagens do cliente (ver AccountService).
    const gerente = Number(insTitular.run("Gerente").lastInsertRowid);
    insAccount.run(gerente, "manager", 0);
  });
  seedAll();
}
