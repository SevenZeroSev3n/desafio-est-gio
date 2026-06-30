import type { Account, AccountType, ApiError, Transaction } from "../types";

const BASE = "/api/v1";

/** Erro lançado quando a API responde com status != 2xx. Carrega a mensagem de negócio. */
export class ApiRequestError extends Error {
  constructor(message: string, public readonly code: string, public readonly status: number) {
    super(message);
    this.name = "ApiRequestError";
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...init,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = data as ApiError;
    throw new ApiRequestError(err.error ?? "Erro inesperado", err.code ?? "UNKNOWN", res.status);
  }
  return data as T;
}

export const bankApi = {
  listAccounts: () => request<Account[]>("/accounts"),

  createAccount: (name: string, type: AccountType, balance: number) =>
    request<Account>("/accounts", {
      method: "POST",
      body: JSON.stringify({ name, type, balance }),
    }),

  withdraw: (id: number, amount: number) =>
    request<Account & { fee_charged: number; transaction_id: string }>(
      `/accounts/${id}/withdraw`,
      { method: "POST", body: JSON.stringify({ amount }) },
    ),

  transfer: (from_id: number, to_id: number, amount: number) =>
    request<{ from: Account; to: Account; fee_charged: number; transaction_id: string }>(
      "/accounts/transfer",
      { method: "POST", body: JSON.stringify({ from_id, to_id, amount }) },
    ),

  history: (id: number) => request<Transaction[]>(`/accounts/${id}/history`),
};
