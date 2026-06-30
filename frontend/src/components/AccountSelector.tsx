import type { Account } from "../types";
import { accountTypeLabel, formatBRL } from "../format";

interface Props {
  accounts: Account[];
  activeAccountId: number | null;
  onSelect: (id: number) => void;
}

/**
 * Dropdown burro da conta ativa. As contas são agrupadas por Titular em <optgroup>:
 * o cabeçalho é o nome do dono e cada opção mostra o tipo + saldo da conta dele.
 */
export function AccountSelector({ accounts, activeAccountId, onSelect }: Props) {
  // Titulares na ordem em que aparecem nas contas (a lista já vem ordenada por id).
  const owners: Account["owner"][] = [];
  for (const a of accounts) {
    if (!owners.some((o) => o.id === a.owner.id)) owners.push(a.owner);
  }

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
        {owners.map((owner) => (
          <optgroup key={owner.id} label={owner.name}>
            {accounts
              .filter((a) => a.owner.id === owner.id)
              .map((a) => (
                <option key={a.id} value={a.id}>
                  {accountTypeLabel(a.type)} ({formatBRL(a.balance)})
                </option>
              ))}
          </optgroup>
        ))}
      </select>
    </div>
  );
}
