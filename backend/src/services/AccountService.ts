import { randomUUID } from "crypto";
import type Database from "better-sqlite3";
import { AppError } from "../errors";
import { toCents, toReais } from "../money";
import type { Account, AccountType, Titular, Transaction } from "../types";
import { policyFor } from "./accountPolicy";

/** Conta como exposta na API: saldo em reais, com o titular dono aninhado. */
export interface AccountDTO {
  id: number;
  type: AccountType;
  balance: number;
  created_at: string;
  owner: { id: number; name: string };
}

/** Linha de conta já com o nome do titular (resultado do join). */
interface AccountRow extends Account {
  owner_name: string;
}

/** Referência ao titular na criação: um existente (id) ou um novo (name). */
export type OwnerRef = { id: number } | { name: string };

const SELECT_ACCOUNT = `
  SELECT a.id, a.owner_id, a.type, a.balance, a.created_at, t.nome AS owner_name
  FROM accounts a
  JOIN titulares t ON t.id = a.owner_id
`;

export class AccountService {
  // O banco é injetado pela aplicação (singleton).
  constructor(private readonly db: Database.Database) {}

  listAccounts(): AccountDTO[] {
    const rows = this.db.prepare(`${SELECT_ACCOUNT} ORDER BY a.id`).all() as AccountRow[];
    return rows.map(toDTO);
  }

  listTitulares(): Titular[] {
    return this.db.prepare("SELECT id, nome FROM titulares ORDER BY id").all() as Titular[];
  }

  getAccount(id: number): AccountDTO {
    return toDTO(this.requireAccount(id));
  }

  /**
   * Cria uma conta para um titular existente (`owner.id`) ou novo (`owner.name`).
   * O titular novo e a conta nascem na mesma transação. Regra de negócio: o saldo
   * inicial não pode ser negativo — o cheque especial da corrente só nasce de um saque.
   */
  createAccount(type: AccountType, initialBalance: number, owner: OwnerRef): AccountDTO {
    if (initialBalance < 0) {
      throw new AppError("Saldo inicial não pode ser negativo", "NEGATIVE_INITIAL_BALANCE", 422);
    }

    let accountId = 0;
    this.db.transaction(() => {
      const ownerId = "id" in owner ? this.requireTitular(owner.id) : this.createTitular(owner.name);
      const info = this.db
        .prepare("INSERT INTO accounts (owner_id, type, balance) VALUES (?, ?, ?)")
        .run(ownerId, type, toCents(initialBalance));
      accountId = Number(info.lastInsertRowid);
    })();

    return this.getAccount(accountId);
  }

  /** Saque: aplica as regras do tipo de conta (R1/R2) e registra a transação. */
  withdraw(accountId: number, amount: number): AccountDTO & {
    fee_charged: number;
    transaction_id: string;
  } {
    const account = this.requireAccount(accountId);
    const amountCents = toCents(amount);
    const feeCents = policyFor(account.type).feeCents;
    const newBalance = this.computeDebit(account, amountCents, feeCents);
    const txId = randomUUID();

    this.db.transaction(() => {
      this.setBalance(accountId, newBalance);
      this.recordTx(txId, accountId, "withdraw", amountCents, feeCents, newBalance);
    })();

    return {
      ...toDTO({ ...account, balance: newBalance }),
      fee_charged: toReais(feeCents),
      transaction_id: txId,
    };
  }

  /**
   * Transferência: a conta de origem segue as regras do seu tipo (tarifa +
   * cheque especial se corrente; sem tarifa e sem negativo se poupança). A
   * conta de destino recebe o valor integral. Débito e crédito são atômicos.
   */
  transfer(fromId: number, toId: number, amount: number) {
    if (fromId === toId) {
      throw new AppError("Não é possível transferir para a mesma conta", "SAME_ACCOUNT", 422);
    }
    const from = this.requireAccount(fromId);
    const to = this.requireAccount(toId);
    const amountCents = toCents(amount);
    const feeCents = policyFor(from.type).feeCents;

    const newFromBalance = this.computeDebit(from, amountCents, feeCents);
    const newToBalance = to.balance + amountCents;
    const txId = randomUUID();

    this.db.transaction(() => {
      this.setBalance(fromId, newFromBalance);
      this.setBalance(toId, newToBalance);
      this.recordTx(txId, fromId, "transfer_out", amountCents, feeCents, newFromBalance);
      this.recordTx(`${txId}-in`, toId, "transfer_in", amountCents, 0, newToBalance);
    })();

    return {
      from: toDTO({ ...from, balance: newFromBalance }),
      to: toDTO({ ...to, balance: newToBalance }),
      fee_charged: toReais(feeCents),
      transaction_id: txId,
    };
  }

  history(accountId: number) {
    this.requireAccount(accountId);
    const rows = this.db
      .prepare("SELECT * FROM transactions WHERE account_id = ? ORDER BY created_at DESC, id DESC")
      .all(accountId) as Transaction[];
    return rows.map((t) => ({
      id: t.id,
      type: t.type,
      amount: toReais(t.amount),
      fee: toReais(t.fee),
      balance_after: toReais(t.balance_after),
      created_at: t.created_at,
    }));
  }

  // --- helpers privados (lógica única, sem duplicação entre saque e transferência) ---

  /**
   * Valida valor e regras do tipo de conta para um débito de `amountCents` +
   * `feeCents`. Retorna o novo saldo (centavos) ou lança AppError.
   */
  private computeDebit(account: Account, amountCents: number, feeCents: number): number {
    if (amountCents <= 0) {
      throw new AppError("Valor deve ser maior que zero", "INVALID_AMOUNT", 422);
    }
    const newBalanceCents = account.balance - amountCents - feeCents;
    policyFor(account.type).assertDebitAllowed({ account, amountCents, feeCents, newBalanceCents });
    return newBalanceCents;
  }

  private requireAccount(id: number): AccountRow {
    const row = this.db.prepare(`${SELECT_ACCOUNT} WHERE a.id = ?`).get(id) as AccountRow | undefined;
    if (!row) throw new AppError("Conta não encontrada", "ACCOUNT_NOT_FOUND", 404);
    return row;
  }

  private requireTitular(id: number): number {
    const row = this.db.prepare("SELECT id FROM titulares WHERE id = ?").get(id) as { id: number } | undefined;
    if (!row) throw new AppError("Titular não encontrado", "OWNER_NOT_FOUND", 422);
    return row.id;
  }

  private createTitular(nome: string): number {
    const info = this.db.prepare("INSERT INTO titulares (nome) VALUES (?)").run(nome);
    return Number(info.lastInsertRowid);
  }

  private setBalance(id: number, balanceCents: number): void {
    this.db.prepare("UPDATE accounts SET balance = ? WHERE id = ?").run(balanceCents, id);
  }

  private recordTx(
    id: string,
    accountId: number,
    type: Transaction["type"],
    amountCents: number,
    feeCents: number,
    balanceAfterCents: number,
  ): void {
    this.db.prepare(
      `INSERT INTO transactions (id, account_id, type, amount, fee, balance_after)
       VALUES (?, ?, ?, ?, ?, ?)`,
    ).run(id, accountId, type, amountCents, feeCents, balanceAfterCents);
  }
}

function toDTO(account: AccountRow): AccountDTO {
  return {
    id: account.id,
    type: account.type,
    balance: toReais(account.balance),
    created_at: account.created_at,
    owner: { id: account.owner_id, name: account.owner_name },
  };
}
