import { useEffect, useState } from "react";
import { bankApi } from "../api/bankApi";
import { formatBRL, formatDate, txLabel } from "../format";
import type { Account, Transaction } from "../types";

interface Props {
  account: Account;
  onClose: () => void;
}

export function HistoryPanel({ account, onClose }: Props) {
  const [txs, setTxs] = useState<Transaction[] | null>(null);

  useEffect(() => {
    bankApi.history(account.id).then(setTxs).catch(() => setTxs([]));
  }, [account.id]);

  return (
    <div className="fixed inset-0 z-10 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900">Histórico — {account.name}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">✕</button>
        </div>

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
    </div>
  );
}
