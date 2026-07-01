import type Database from "better-sqlite3";
import type { Account, AccountType, Titular, Transaction } from "../types";

/** Linha de conta já com o nome do titular (resultado do join). */
export interface AccountRow extends Account {
  owner_name: string;
}

const SELECT_ACCOUNT = `
  SELECT a.id, a.owner_id, a.type, a.balance, a.created_at, t.nome AS owner_name
  FROM accounts a
  JOIN titulares t ON t.id = a.owner_id
`;

/** Acesso direto ao SQLite (queries/inserts/updates). Sem regra de negócio — isso vive em AccountService. */
export class AccountRepository {
  constructor(private readonly db: Database.Database) {}

  /** Executa `fn` numa transação atômica do SQLite e retorna o valor produzido por ela. */
  transaction<T>(fn: () => T): T {
    return this.db.transaction(fn)();
  }

  listVisible(): AccountRow[] {
    return this.db.prepare(`${SELECT_ACCOUNT} WHERE a.type != 'manager' ORDER BY a.id`).all() as AccountRow[];
  }

  findTypeById(id: number): AccountType | undefined {
    const row = this.db.prepare("SELECT type FROM accounts WHERE id = ?").get(id) as
      | { type: AccountType }
      | undefined;
    return row?.type;
  }

  listTitulares(): Titular[] {
    return this.db
      .prepare(
        `SELECT id, nome FROM titulares
         WHERE id NOT IN (SELECT owner_id FROM accounts WHERE type = 'manager')
         ORDER BY id`,
      )
      .all() as Titular[];
  }

  findById(id: number): AccountRow | undefined {
    return this.db.prepare(`${SELECT_ACCOUNT} WHERE a.id = ?`).get(id) as AccountRow | undefined;
  }

  findManager(): AccountRow | undefined {
    return this.db.prepare(`${SELECT_ACCOUNT} WHERE a.type = 'manager'`).get() as AccountRow | undefined;
  }

  findTitularId(id: number): number | undefined {
    const row = this.db.prepare("SELECT id FROM titulares WHERE id = ?").get(id) as { id: number } | undefined;
    return row?.id;
  }

  insertTitular(nome: string): number {
    const info = this.db.prepare("INSERT INTO titulares (nome) VALUES (?)").run(nome);
    return Number(info.lastInsertRowid);
  }

  insertAccount(ownerId: number, type: AccountType, balanceCents: number): number {
    const info = this.db
      .prepare("INSERT INTO accounts (owner_id, type, balance) VALUES (?, ?, ?)")
      .run(ownerId, type, balanceCents);
    return Number(info.lastInsertRowid);
  }

  setBalance(id: number, balanceCents: number): void {
    this.db.prepare("UPDATE accounts SET balance = ? WHERE id = ?").run(balanceCents, id);
  }

  insertTransaction(
    id: string,
    accountId: number,
    type: Transaction["type"],
    amountCents: number,
    feeCents: number,
    balanceAfterCents: number,
  ): void {
    this.db
      .prepare(
        `INSERT INTO transactions (id, account_id, type, amount, fee, balance_after)
         VALUES (?, ?, ?, ?, ?, ?)`,
      )
      .run(id, accountId, type, amountCents, feeCents, balanceAfterCents);
  }

  listTransactions(accountId: number): Transaction[] {
    return this.db
      .prepare("SELECT * FROM transactions WHERE account_id = ? ORDER BY created_at DESC, id DESC")
      .all(accountId) as Transaction[];
  }
}
