import { useMemo, useState } from "react";
import type { Account } from "../types";

/**
 * Cliente (Titular) em foco e a conta ativa dele. Seleção é derivada com fallback
 * (primeiro cliente / primeira conta) para dispensar efeitos de sincronização —
 * se o id selecionado sumir da lista, cai pro primeiro item automaticamente.
 */
export function useSelection(accounts: Account[]) {
  const [selectedClientId, setSelectedClientId] = useState<number | null>(null);
  const [activeAccountId, setActiveAccountId] = useState<number | null>(null);

  // Clientes = Titulares com contas visíveis, na ordem em que aparecem.
  const clients = useMemo(() => {
    const seen: Account["owner"][] = [];
    for (const a of accounts) if (!seen.some((o) => o.id === a.owner.id)) seen.push(a.owner);
    return seen;
  }, [accounts]);

  const selectedClient = clients.find((c) => c.id === selectedClientId) ?? clients[0] ?? null;
  const clientAccounts = accounts.filter((a) => a.owner.id === selectedClient?.id);
  const activeAccount =
    clientAccounts.find((a) => a.id === activeAccountId) ?? clientAccounts[0] ?? null;
  const activeId = activeAccount?.id ?? null;

  function selectClient(clientId: number) {
    setSelectedClientId(clientId);
    setActiveAccountId(accounts.find((a) => a.owner.id === clientId)?.id ?? null);
  }

  function selectAccount(accountId: number) {
    setActiveAccountId(accountId);
    const acc = accounts.find((a) => a.id === accountId);
    if (acc) setSelectedClientId(acc.owner.id);
  }

  return {
    clients,
    selectedClient,
    clientAccounts,
    activeAccount,
    activeId,
    selectClient,
    selectAccount,
    /** Setters diretos: usados quando o dado ainda não está em `accounts` (ex.: conta recém-criada). */
    setSelectedClientId,
    setActiveAccountId,
  };
}
