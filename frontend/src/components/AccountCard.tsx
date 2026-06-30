import type { Account } from "../types";
import { accountTypeLabel, formatBRL } from "../format";

interface Props {
  account: Account;
}

export function AccountCard({ account }: Props) {
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
    </div>
  );
}
