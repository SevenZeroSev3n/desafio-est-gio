import { randomUUID } from "crypto";
import type Database from "better-sqlite3";
import { AppError } from "../errors";
import { toCents, toReais } from "../money";
import type { Account, AccountType, Titular } from "../types";
import { policyFor } from "./accountPolicy";
import { AccountRepository, type AccountRow } from "./AccountRepository";

/** Conta como exposta na API: saldo em reais, com o titular dono aninhado. */
export interface AccountDTO {
  id: number;
  type: AccountType;
  balance: number;
  created_at: string;
  owner: { id: number; name: string };
}

/** Referência ao titular na criação: um existente (id) ou um novo (name). */
export type OwnerRef = { id: number } | { name: string };

/** Regras de negócio (saque, transferência, criação, carteira do gerente). Persistência fica em AccountRepository. */
export class AccountService {
  private readonly repo: AccountRepository;

  constructor(db: Database.Database) {
    this.repo = new AccountRepository(db);
  }

  listAccounts(): AccountDTO[] {
    // A conta do gerente é interna: nunca aparece na listagem do cliente.
    return this.repo.listVisible().map(toDTO);
  }

  /** Verdadeiro se o id aponta para a conta interna do gerente (acumuladora de tarifas). */
  isManager(id: number): boolean {
    return this.repo.findTypeById(id) === "manager";
  }

  listTitulares(): Titular[] {
    // O titular dono da conta interna do gerente não é um cliente: fica de fora.
    return this.repo.listTitulares();
  }

  /** Carteira interna do gerente: a conta que acumula as tarifas das correntes. */
  getManagerWallet(): AccountDTO {
    return toDTO(this.requireManager());
  }

  /** Extrato da carteira do gerente — as tarifas creditadas, mais recentes primeiro. */
  managerHistory() {
    return this.history(this.requireManager().id);
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

    const accountId = this.repo.transaction(() => {
      const ownerId = "id" in owner ? this.requireTitular(owner.id) : this.repo.insertTitular(owner.name);
      return this.repo.insertAccount(ownerId, type, toCents(initialBalance));
    });

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

    this.repo.transaction(() => {
      this.repo.setBalance(accountId, newBalance);
      this.repo.insertTransaction(txId, accountId, "withdraw", amountCents, feeCents, newBalance);
      this.creditManagerFee(txId, feeCents);
    });

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

    this.repo.transaction(() => {
      this.repo.setBalance(fromId, newFromBalance);
      this.repo.setBalance(toId, newToBalance);
      this.repo.insertTransaction(txId, fromId, "transfer_out", amountCents, feeCents, newFromBalance);
      this.repo.insertTransaction(`${txId}-in`, toId, "transfer_in", amountCents, 0, newToBalance);
      this.creditManagerFee(txId, feeCents);
    });

    return {
      from: toDTO({ ...from, balance: newFromBalance }),
      to: toDTO({ ...to, balance: newToBalance }),
      fee_charged: toReais(feeCents),
      transaction_id: txId,
    };
  }

  history(accountId: number) {
    this.requireAccount(accountId);
    return this.repo.listTransactions(accountId).map((t) => ({
      id: t.id,
      type: t.type,
      amount: toReais(t.amount),
      fee: toReais(t.fee),
      balance_after: toReais(t.balance_after),
      created_at: t.created_at,
    }));
  }

  // --- helpers privados (regra de negócio; nenhum SQL aqui — vive em AccountRepository) ---

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
    const row = this.repo.findById(id);
    if (!row) throw new AppError("Conta não encontrada", "ACCOUNT_NOT_FOUND", 404);
    return row;
  }

  private requireManager(): AccountRow {
    const row = this.repo.findManager();
    if (!row) throw new AppError("Conta do gerente não encontrada", "MANAGER_NOT_FOUND", 404);
    return row;
  }

  private requireTitular(id: number): number {
    const ownerId = this.repo.findTitularId(id);
    if (ownerId === undefined) throw new AppError("Titular não encontrado", "OWNER_NOT_FOUND", 422);
    return ownerId;
  }

  /**
   * Credita a tarifa de uma operação na conta interna do gerente, na mesma
   * transação do débito. Registra uma linha (transfer_in) para o saldo do
   * gerente seguir igual à soma do seu histórico. Tarifa zero (poupança) não
   * gera linha. Sem conta de gerente (banco ainda não populado), é um no-op.
   * Deve ser chamada dentro de uma transação aberta pelo chamador.
   */
  private creditManagerFee(sourceTxId: string, feeCents: number): void {
    if (feeCents <= 0) return;
    const manager = this.repo.findManager();
    if (!manager) return;
    const newBalance = manager.balance + feeCents;
    this.repo.setBalance(manager.id, newBalance);
    this.repo.insertTransaction(`${sourceTxId}-fee`, manager.id, "transfer_in", feeCents, 0, newBalance);
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
