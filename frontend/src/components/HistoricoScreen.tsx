import { useState } from "react";
import type { Account, Transaction } from "../types";
import { formatBRL, formatDate, txLabel } from "../format";

interface Props {
  account: Account;
  txs: Transaction[] | null;
}

type Filter = "all" | "in" | "out";

const FILTERS: { key: Filter; label: string }[] = [
  { key: "all", label: "Todas" },
  { key: "in", label: "Entradas" },
  { key: "out", label: "Saídas" },
];

function isEntrada(t: Transaction) {
  return t.type === "transfer_in";
}

/** Rótulo de dia (pt-BR) a partir do created_at UTC do backend. */
function dayLabel(iso: string) {
  return new Date(iso.replace(" ", "T") + "Z").toLocaleDateString("pt-BR");
}

/**
 * Tela "Histórico": extrato completo da conta ativa, agrupado por dia, com filtro
 * Todas / Entradas / Saídas. Só exibe — os dados vêm de /accounts/:id/history.
 */
export function HistoricoScreen({ account, txs }: Props) {
  const [filter, setFilter] = useState<Filter>("all");

  const filtered = (txs ?? []).filter((t) =>
    filter === "in" ? isEntrada(t) : filter === "out" ? !isEntrada(t) : true,
  );

  // Agrupa por dia preservando a ordem (o backend já devolve mais recente primeiro).
  const groups: { day: string; items: Transaction[] }[] = [];
  for (const t of filtered) {
    const day = dayLabel(t.created_at);
    const last = groups[groups.length - 1];
    if (last && last.day === day) last.items.push(t);
    else groups.push({ day, items: [t] });
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-2">
          {FILTERS.map((f) => {
            const on = filter === f.key;
            return (
              <button
                key={f.key}
                type="button"
                onClick={() => setFilter(f.key)}
                className={`rounded-full border px-4 py-2 text-[12.5px] font-semibold transition ${
                  on ? "border-accent bg-chip text-accent" : "border-border text-muted hover:text-text"
                }`}
              >
                {f.label}
              </button>
            );
          })}
        </div>
        <span className="text-xs text-muted">
          {account.owner.name} · conta #{account.id}
        </span>
      </div>

      <div className="rounded-[20px] border border-border bg-panel p-6 shadow-panel">
        {txs === null && <p className="py-2 text-sm text-muted">Carregando...</p>}
        {txs?.length === 0 && <p className="py-2 text-sm text-muted">Nenhuma transação ainda.</p>}
        {txs && txs.length > 0 && filtered.length === 0 && (
          <p className="py-2 text-sm text-muted">Nada neste filtro.</p>
        )}

        {groups.map((g) => (
          <div key={g.day}>
            <div className="mt-3 mb-1 text-[11.5px] font-semibold uppercase tracking-[0.06em] text-faint">
              {g.day}
            </div>
            <ul>
              {g.items.map((t) => {
                const entrada = isEntrada(t);
                const tone = entrada ? "text-pos" : "text-neg";
                const chip = entrada ? "bg-pos/15 text-pos" : "bg-neg/15 text-neg";
                return (
                  <li
                    key={t.id}
                    className="-mx-2 flex items-center justify-between rounded-xl px-2 py-3 transition hover:bg-panel2"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`flex h-9 w-9 items-center justify-center rounded-[11px] font-display text-base font-bold ${chip}`}
                      >
                        {entrada ? "↓" : "↑"}
                      </div>
                      <div>
                        <p className="text-[13.5px] font-semibold">{txLabel(t.type)}</p>
                        <p className="text-[11.5px] text-muted">{formatDate(t.created_at)}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`font-display text-sm font-semibold ${tone}`}>
                        {entrada ? "+" : "−"} {formatBRL(t.amount)}
                      </p>
                      {t.fee > 0 && <p className="text-[11px] text-muted">tarifa {formatBRL(t.fee)}</p>}
                      <p className="text-[11px] text-muted">saldo {formatBRL(t.balance_after)}</p>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
