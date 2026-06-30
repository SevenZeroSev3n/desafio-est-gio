export type AccountType = "checking" | "savings";

export interface Account {
  id: number;
  name: string;
  type: AccountType;
  balance: number;
  created_at: string;
}

export interface Transaction {
  id: string;
  type: "withdraw" | "transfer_out" | "transfer_in";
  amount: number;
  fee: number;
  balance_after: number;
  created_at: string;
}

/** Erro padronizado retornado pela API. */
export interface ApiError {
  error: string;
  code: string;
  [key: string]: unknown;
}
