import type { Account } from "../types";
import { accountTypeLabel, formatBRL } from "../format";

interface Props {
  accounts: Account[];
  activeAccountId: number | null;
  onSelect: (id: number) => void;
}

/**
 * Dropdown burro da conta ativa. As contas são agrupadas por tipo em <optgroup>
 * (Conta Corrente / Conta Poupança) para separar visualmente os dois tipos.
 */
export function AccountSelector({ accounts, activeAccountId, onSelect }: Props) {
  const checking = accounts.filter((a) => a.type === "checking");
  const savings = accounts.filter((a) => a.type === "savings");

  const options = (list: Account[]) =>
    list.map((a) => (
      <option key={a.id} value={a.id}>
        {a.name} ({formatBRL(a.balance)})
      </option>
    ));

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
        {checking.length > 0 && (
          <optgroup label={accountTypeLabel("checking")}>{options(checking)}</optgroup>
        )}
        {savings.length > 0 && (
          <optgroup label={accountTypeLabel("savings")}>{options(savings)}</optgroup>
        )}
      </select>
    </div>
  );
}
