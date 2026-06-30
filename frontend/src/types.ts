export type AccountType = "checking" | "savings";

export interface Titular {
  id: number;
  nome: string;
}

export interface Account {
  id: number;
  type: AccountType;
  balance: number;
  created_at: string;
  owner: { id: number; name: string };
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
