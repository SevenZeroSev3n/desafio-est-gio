import type { AccountType, Transaction } from "./types";

const brl = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

export function formatBRL(value: number): string {
  return brl.format(value);
}

export function accountTypeLabel(type: AccountType): string {
  return type === "checking" ? "Conta Corrente" : "Conta Poupança";
}

export function txLabel(type: Transaction["type"]): string {
  switch (type) {
    case "withdraw":
      return "Saque";
    case "transfer_out":
      return "Transferência enviada";
    case "transfer_in":
      return "Transferência recebida";
  }
}

export function formatDate(iso: string): string {
  // O backend grava em UTC (datetime('now')); exibe no fuso local.
  const d = new Date(iso.replace(" ", "T") + "Z");
  return d.toLocaleString("pt-BR");
}
