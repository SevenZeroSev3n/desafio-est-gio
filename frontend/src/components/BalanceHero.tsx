import type { Account, Transaction } from "../types";
import { accountTypeLabel, formatBRL } from "../format";
import { summarize } from "../lib/history";
import { Sparkline } from "./Sparkline";

interface Props {
  account: Account;
  /** Histórico da conta ativa, ou null enquanto carrega. */
  txs: Transaction[] | null;
}

/** Card-herói: saldo, tipo da conta, trajetória de saldo e totais entradas/saídas. */
export function BalanceHero({ account, txs }: Props) {
  const { entradas, saidas, series } = summarize(txs ?? []);
  const negative = account.balance < 0;

  return (
    <section
      id="saldo"
      className="scroll-mt-4 rounded-[20px] border border-border bg-panel p-6 pb-2 shadow-panel"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-sm text-muted">Saldo disponível</span>
          <span className="rounded-full bg-chip px-2.5 py-1 text-[10.5px] font-semibold text-accent">
            {accountTypeLabel(account.type)}
          </span>
        </div>
        <span className="text-xs text-muted">#{account.id}</span>
      </div>

      <p
        className={`mt-2 font-display text-[40px] font-bold leading-none tracking-tight ${
          negative ? "text-neg" : "text-text"
        }`}
      >
        {formatBRL(account.balance)}
      </p>

      <Sparkline series={series} />

      <div className="mt-1 flex gap-8 border-t border-border py-4">
        <div>
          <div className="text-[11px] font-medium text-muted">Entradas</div>
          <div className="mt-0.5 font-display text-base font-semibold text-pos">
            + {formatBRL(entradas)}
          </div>
        </div>
        <div>
          <div className="text-[11px] font-medium text-muted">Saídas</div>
          <div className="mt-0.5 font-display text-base font-semibold text-neg">
            − {formatBRL(saidas)}
          </div>
        </div>
      </div>
    </section>
  );
}
