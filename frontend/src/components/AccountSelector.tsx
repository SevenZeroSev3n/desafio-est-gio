import type { Account } from "../types";
import { accountTypeLabel, formatBRL } from "../format";

interface Props {
  accounts: Account[];
  activeAccountId: number | null;
  onSelect: (id: number) => void;
}

/** Dropdown burro da conta ativa: lista nome + tipo + saldo. Não busca dados. */
export function AccountSelector({ accounts, activeAccountId, onSelect }: Props) {
  return (
    <div>
      <label htmlFor="account-selector" className="block text-sm font-medium text-slate-700">
        Conta ativa
      </label>
      <select
        id="account-selector"
        value={activeAccountId ?? ""}
        onChange={(e) => onSelect(Number(e.target.value))}
        className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm sm:max-w-md"
      >
        {accounts.map((a) => (
          <option key={a.id} value={a.id}>
            {a.name} — {accountTypeLabel(a.type)} ({formatBRL(a.balance)})
          </option>
        ))}
      </select>
    </div>
  );
}
