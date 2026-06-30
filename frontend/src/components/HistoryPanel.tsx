import { useEffect, useState } from "react";
import { bankApi } from "../api/bankApi";
import { formatBRL, formatDate, txLabel } from "../format";
import type { Account, Transaction } from "../types";

interface Props {
  account: Account;
}

/** Histórico inline da conta ativa. Refetcha ao trocar de conta. */
export function HistoryPanel({ account }: Props) {
  const [txs, setTxs] = useState<Transaction[] | null>(null);

  useEffect(() => {
    // Guard de corrida: trocar de conta rapido pode resolver respostas fora de
    // ordem; ignoramos a resposta se a conta ativa mudou no meio.
    let active = true;
    setTxs(null);
    bankApi
      .history(account.id)
      .then((data) => active && setTxs(data))
      .catch(() => active && setTxs([]));
    return () => {
      active = false;
    };
  }, [account.id]);

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <h3 className="font-semibold text-slate-900">Histórico — {account.owner.name}</h3>

      <div className="mt-4 max-h-80 overflow-y-auto">
        {txs === null && <p className="text-sm text-slate-500">Carregando...</p>}
        {txs?.length === 0 && <p className="text-sm text-slate-500">Nenhuma transação ainda.</p>}
        <ul className="divide-y divide-slate-100">
          {txs?.map((t) => (
            <li key={t.id} className="flex items-center justify-between py-2 text-sm">
              <div>
                <p className="font-medium text-slate-800">{txLabel(t.type)}</p>
                <p className="text-xs text-slate-400">{formatDate(t.created_at)}</p>
              </div>
              <div className="text-right">
                <p className="font-medium text-slate-800">{formatBRL(t.amount)}</p>
                {t.fee > 0 && <p className="text-xs text-slate-400">tarifa {formatBRL(t.fee)}</p>}
                <p className="text-xs text-slate-500">saldo {formatBRL(t.balance_after)}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
