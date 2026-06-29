import { randomUUID } from "crypto";
import db from "../db/database";
import { AppError } from "../errors";
import { toCents, toReais } from "../money";
import type { Account, AccountType, Transaction } from "../types";

// Regras de negócio (seção 6 da especificação), em centavos.
const CHECKING_FEE_CENTS = 100; // R$ 1,00 por operação (R1)
const CHECKING_OVERDRAFT_LIMIT_CENTS = -50_000; // cheque especial até -R$ 500,00 (R1)

/** Conta como exposta na API: saldo em reais. */
export interface AccountDTO {
  id: number;
  name: string;
  type: AccountType;
  balance: number;
  created_at: string;
}

export class AccountService {
  listAccounts(): AccountDTO[] {
    const rows = db
      .prepare("SELECT * FROM accounts ORDER BY id")
      .all() as Account[];
    return rows.map(toDTO);
  }

  getAccount(id: number): AccountDTO {
    return toDTO(this.requireAccount(id));
  }

  createAccount(name: string, type: AccountType, initialBalance: number): AccountDTO {
    const info = db
      .prepare("INSERT INTO accounts (name, type, balance) VALUES (?, ?, ?)")
      .run(name, type, toCents(initialBalance));
    return this.getAccount(Number(info.lastInsertRowid));
  }

  /** Saque: aplica as regras do tipo de conta (R1/R2) e registra a transação. */
  withdraw(accountId: number, amount: number): AccountDTO & {
    fee_charged: number;
    transaction_id: string;
  } {
    const account = this.requireAccount(accountId);
    const amountCents = toCents(amount);
    const feeCents = feeFor(account.type);
    const newBalance = this.computeDebit(account, amountCents, feeCents);
    const txId = randomUUID();

    db.transaction(() => {
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
    const feeCents = feeFor(from.type);

    const newFromBalance = this.computeDebit(from, amountCents, feeCents);
    const newToBalance = to.balance + amountCents;
    const txId = randomUUID();

    db.transaction(() => {
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
    const rows = db
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
    const newBalance = account.balance - amountCents - feeCents;

    if (account.type === "checking" && newBalance < CHECKING_OVERDRAFT_LIMIT_CENTS) {
      throw new AppError("Saldo insuficiente (limite de cheque especial atingido)", "INSUFFICIENT_FUNDS", 422, {
        current_balance: toReais(account.balance),
        requested: toReais(amountCents),
        fee: toReais(feeCents),
        overdraft_limit: toReais(CHECKING_OVERDRAFT_LIMIT_CENTS),
      });
    }
    if (account.type === "savings" && newBalance < 0) {
      throw new AppError("Conta poupança não pode ficar com saldo negativo", "SAVINGS_NEGATIVE_BALANCE", 422, {
        current_balance: toReais(account.balance),
        requested: toReais(amountCents),
      });
    }
    return newBalance;
  }

  private requireAccount(id: number): Account {
    const account = db.prepare("SELECT * FROM accounts WHERE id = ?").get(id) as Account | undefined;
    if (!account) throw new AppError("Conta não encontrada", "ACCOUNT_NOT_FOUND", 404);
    return account;
  }

  private setBalance(id: number, balanceCents: number): void {
    db.prepare("UPDATE accounts SET balance = ? WHERE id = ?").run(balanceCents, id);
  }

  private recordTx(
    id: string,
    accountId: number,
    type: Transaction["type"],
    amountCents: number,
    feeCents: number,
    balanceAfterCents: number,
  ): void {
    db.prepare(
      `INSERT INTO transactions (id, account_id, type, amount, fee, balance_after)
       VALUES (?, ?, ?, ?, ?, ?)`,
    ).run(id, accountId, type, amountCents, feeCents, balanceAfterCents);
  }
}

function feeFor(type: AccountType): number {
  return type === "checking" ? CHECKING_FEE_CENTS : 0;
}

function toDTO(account: Account): AccountDTO {
  return {
    id: account.id,
    name: account.name,
    type: account.type,
    balance: toReais(account.balance),
    created_at: account.created_at,
  };
}
