export type AccountType = "checking" | "savings";

/** Conta como persistida. Saldo sempre em centavos (inteiro) para evitar erro de float. */
export interface Account {
  id: number;
  name: string;
  type: AccountType;
  balance: number; // centavos
  created_at: string;
}

export type TransactionType =
  | "withdraw"
  | "transfer_out"
  | "transfer_in";

export interface Transaction {
  id: string;
  account_id: number;
  type: TransactionType;
  amount: number; // centavos
  fee: number; // centavos
  balance_after: number; // centavos
  created_at: string;
}
