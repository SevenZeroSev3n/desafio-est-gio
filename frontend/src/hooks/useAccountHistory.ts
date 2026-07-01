import { useCallback, useEffect, useRef, useState } from "react";
import { bankApi } from "../api/bankApi";
import type { Transaction } from "../types";

/**
 * Histórico da conta ativa. Rerroda ao trocar de conta (limpando a lista durante a
 * troca). `refetch` força uma nova busca sem limpar a lista — usado após uma operação
 * (saque/transferência), onde o extrato antigo deve continuar visível até o novo chegar.
 */
export function useAccountHistory(accountId: number | null) {
  const [txs, setTxs] = useState<Transaction[] | null>(null);
  const lastAccountIdRef = useRef(accountId);

  const load = useCallback(
    (isSwitch: boolean) => {
      if (accountId === null) {
        setTxs(null);
        return () => {};
      }
      let active = true;
      if (isSwitch) setTxs(null);
      bankApi
        .history(accountId)
        .then((data) => active && setTxs(data))
        .catch(() => {
          if (active && isSwitch) setTxs([]);
        });
      return () => {
        active = false;
      };
    },
    [accountId],
  );

  useEffect(() => {
    const isSwitch = lastAccountIdRef.current !== accountId;
    lastAccountIdRef.current = accountId;
    return load(isSwitch);
  }, [accountId, load]);

  const refetch = useCallback(() => load(false), [load]);

  return { txs, refetch };
}
