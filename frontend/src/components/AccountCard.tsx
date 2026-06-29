import type { Account } from "../types";
import { accountTypeLabel, formatBRL } from "../format";

interface Props {
  account: Account;
  onWithdraw: (account: Account) => void;
  onShowHistory: (account: Account) => void;
}

export function AccountCard({ account, onWithdraw, onShowHistory }: Props) {
  const negative = account.balance < 0;
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="font-semibold text-slate-900">{account.name}</h3>
          <span
            className={`mt-1 inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
              account.type === "checking"
                ? "bg-indigo-100 text-indigo-700"
                : "bg-emerald-100 text-emerald-700"
            }`}
          >
            {accountTypeLabel(account.type)}
          </span>
        </div>
        <span className="text-xs text-slate-400">#{account.id}</span>
      </div>

      <p className={`mt-4 text-2xl font-bold ${negative ? "text-rose-600" : "text-slate-900"}`}>
        {formatBRL(account.balance)}
      </p>

      <div className="mt-4 flex gap-2">
        <button
          onClick={() => onWithdraw(account)}
          className="flex-1 rounded-lg bg-indigo-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-indigo-700"
        >
          Sacar
        </button>
        <button
          onClick={() => onShowHistory(account)}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
        >
          Histórico
        </button>
      </div>
    </div>
  );
}
