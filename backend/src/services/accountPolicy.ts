import { AppError } from "../errors";
import { toReais } from "../money";
import type { Account, AccountType } from "../types";

const CHECKING_FEE_CENTS = 100; // R$ 1,00 por operação
const CHECKING_OVERDRAFT_LIMIT_CENTS = -50_000; // cheque especial até -R$ 500,00

interface DebitContext {
  account: Account;
  amountCents: number;
  feeCents: number;
  newBalanceCents: number;
}

/** Comportamento de débito específico de cada tipo de conta: tarifa e limite de saldo. */
export interface AccountPolicy {
  readonly feeCents: number;
  /** Lança AppError se o novo saldo violar a regra do tipo. */
  assertDebitAllowed(ctx: DebitContext): void;
}

const checkingPolicy: AccountPolicy = {
  feeCents: CHECKING_FEE_CENTS,
  assertDebitAllowed({ account, amountCents, feeCents, newBalanceCents }) {
    if (newBalanceCents < CHECKING_OVERDRAFT_LIMIT_CENTS) {
      throw new AppError("Saldo insuficiente (limite de cheque especial atingido)", "INSUFFICIENT_FUNDS", 422, {
        current_balance: toReais(account.balance),
        requested: toReais(amountCents),
        fee: toReais(feeCents),
        overdraft_limit: toReais(CHECKING_OVERDRAFT_LIMIT_CENTS),
      });
    }
  },
};

const savingsPolicy: AccountPolicy = {
  feeCents: 0,
  assertDebitAllowed({ account, amountCents, newBalanceCents }) {
    if (newBalanceCents < 0) {
      throw new AppError("Conta poupança não pode ficar com saldo negativo", "SAVINGS_NEGATIVE_BALANCE", 422, {
        current_balance: toReais(account.balance),
        requested: toReais(amountCents),
      });
    }
  },
};

const POLICIES: Record<AccountType, AccountPolicy> = {
  checking: checkingPolicy,
  savings: savingsPolicy,
};

/** Seleciona a policy do tipo. Um novo tipo de conta é uma entrada nova aqui, sem tocar no AccountService. */
export function policyFor(type: AccountType): AccountPolicy {
  return POLICIES[type];
}
