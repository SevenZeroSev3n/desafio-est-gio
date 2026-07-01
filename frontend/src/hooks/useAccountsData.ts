import { useCallback, useEffect, useState } from "react";
import { bankApi } from "../api/bankApi";
import type { Account, Titular } from "../types";

/** Contas e titulares carregados da API. `refresh` é chamado de novo após cada operação (saque/transferência/criação). */
export function useAccountsData() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [titulares, setTitulares] = useState<Titular[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      const [list, owners] = await Promise.all([bankApi.listAccounts(), bankApi.listTitulares()]);
      setAccounts(list);
      setTitulares(owners);
      setLoadError(null);
    } catch {
      setLoadError("Não foi possível carregar as contas. O backend está rodando na porta 3001?");
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { accounts, titulares, loadError, refresh };
}
