import type { Transaction } from "../types";
import { formatBRL, formatDate, txLabel } from "../format";
import { txStyle } from "../lib/txStyle";

interface Props {
  tx: Transaction;
  /** compact: ContasScreen mini-list (sign+amount only). full: extrato completo (com tarifa/saldo). */
  variant: "compact" | "full";
  /** Sobrescreve o rótulo padrão do tipo (ManagerWallet mostra "Tarifa de operação" em vez de "Transferência recebida"). */
  label?: string;
}

/** Linha de transação: ícone, rótulo, data e valor. Estilo compartilhado entre as telas que listam histórico. */
export function TxRow({ tx, variant, label }: Props) {
  const s = txStyle(tx.type);

  if (variant === "compact") {
    return (
      <li className="flex items-center justify-between border-b border-border py-2.5">
        <div className="flex items-center gap-3">
          <div
            className={`flex h-8 w-8 items-center justify-center rounded-[9px] font-display text-[13px] font-bold ${s.chip}`}
          >
            {s.glyph}
          </div>
          <div>
            <p className="text-[12.5px] font-semibold">{label ?? txLabel(tx.type)}</p>
            <p className="text-[11px] text-muted">{formatDate(tx.created_at)}</p>
          </div>
        </div>
        <span className={`font-display text-[12.5px] font-semibold ${s.tone}`}>
          {s.sign} {formatBRL(tx.amount)}
        </span>
      </li>
    );
  }

  return (
    <li className="-mx-2 flex items-center justify-between rounded-xl px-2 py-3 transition hover:bg-panel2">
      <div className="flex items-center gap-3">
        <div
          className={`flex h-9 w-9 items-center justify-center rounded-[11px] font-display text-base font-bold ${s.chip}`}
        >
          {s.glyph}
        </div>
        <div>
          <p className="text-[13.5px] font-semibold">{label ?? txLabel(tx.type)}</p>
          <p className="text-[11.5px] text-muted">{formatDate(tx.created_at)}</p>
        </div>
      </div>
      <div className="text-right">
        <p className={`font-display text-sm font-semibold ${s.tone}`}>
          {s.sign} {formatBRL(tx.amount)}
        </p>
        {tx.fee > 0 && <p className="text-[11px] text-muted">tarifa {formatBRL(tx.fee)}</p>}
        <p className="text-[11px] text-muted">saldo {formatBRL(tx.balance_after)}</p>
      </div>
    </li>
  );
}
