import type { Account } from "../types";
import { accountTypeLabel, formatBRL } from "../format";

interface Props {
  accounts: Account[];
  activeAccountId: number | null;
  onSelect: (id: number) => void;
  onNewAccount: () => void;
}

/**
 * Navegação lateral: lista as contas agrupadas por Titular. Clicar numa conta a
 * torna a conta ativa (modelo single-active-account). Sem nav de páginas — não
 * há rotas — e sem usuário "logado": o app opera sobre todos os titulares.
 */
export function Sidebar({ accounts, activeAccountId, onSelect, onNewAccount }: Props) {
  // Titulares na ordem em que aparecem (a lista já vem ordenada por id da conta).
  const owners: Account["owner"][] = [];
  for (const a of accounts) {
    if (!owners.some((o) => o.id === a.owner.id)) owners.push(a.owner);
  }

  return (
    <aside className="flex w-full flex-col gap-7 border-border bg-panel p-5 md:w-[236px] md:flex-none md:border-r">
      <div className="flex items-center gap-3 px-1.5">
        <div className="h-9 w-9 rounded-[10px] bg-gradient-to-br from-accent to-accent2 shadow-accent" />
        <div>
          <div className="font-display text-base font-bold leading-none">Agilize</div>
          <div className="mt-0.5 text-[9px] font-semibold uppercase tracking-[0.14em] text-muted">
            Banking
          </div>
        </div>
      </div>

      <nav className="flex flex-col gap-5">
        <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-faint">
          Titulares
        </div>
        {owners.map((owner) => (
          <div key={owner.id} className="flex flex-col gap-1.5">
            <div className="px-1 text-xs font-semibold text-muted">{owner.name}</div>
            {accounts
              .filter((a) => a.owner.id === owner.id)
              .map((a) => {
                const active = a.id === activeAccountId;
                return (
                  <button
                    key={a.id}
                    type="button"
                    aria-current={active ? "true" : undefined}
                    onClick={() => onSelect(a.id)}
                    className={`flex items-center justify-between gap-2 rounded-xl px-3 py-2.5 text-left transition ${
                      active
                        ? "bg-chip text-accent"
                        : "text-muted hover:bg-panel2 hover:text-text"
                    }`}
                  >
                    <span className="flex items-center gap-2.5">
                      <span
                        className={`h-1.5 w-1.5 rounded-sm ${active ? "bg-accent" : "bg-current opacity-50"}`}
                      />
                      <span className="text-[13px] font-medium">{accountTypeLabel(a.type)}</span>
                    </span>
                    <span className="font-display text-[11px] font-semibold tabular-nums">
                      {formatBRL(a.balance)}
                    </span>
                  </button>
                );
              })}
          </div>
        ))}

        <button
          type="button"
          onClick={onNewAccount}
          className="mt-1 rounded-xl border border-dashed border-border px-3 py-2.5 text-left text-[13px] font-semibold text-muted transition hover:border-accent hover:text-text"
        >
          + Nova conta
        </button>
      </nav>
    </aside>
  );
}
