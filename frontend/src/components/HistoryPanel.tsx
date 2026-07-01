import { formatBRL, formatDate, txLabel } from "../format";
import type { Transaction } from "../types";

interface Props {
  ownerName: string;
  /** Histórico da conta ativa, ou null enquanto carrega. */
  txs: Transaction[] | null;
}

/** Entrada = crédito (verde, ↓); saída = saque/transferência enviada (vermelho, ↑). */
function rowStyle(type: Transaction["type"]) {
  if (type === "transfer_in") {
    return { sign: "+", glyph: "↓", tone: "text-pos", chip: "bg-pos/15 text-pos" };
  }
  return { sign: "−", glyph: "↑", tone: "text-neg", chip: "bg-neg/15 text-neg" };
}

/** Histórico inline da conta ativa. */
export function HistoryPanel({ ownerName, txs }: Props) {
  return (
    <section id="historico" className="scroll-mt-4 rounded-[20px] border border-border bg-panel p-6 shadow-panel">
      <div className="flex items-center justify-between">
        <h3 className="font-display text-base font-bold">Histórico</h3>
        <span className="text-xs text-muted">{ownerName}</span>
      </div>

      <div className="mt-3 max-h-80 overflow-y-auto overflow-x-hidden">
        {txs === null && <p className="py-2 text-sm text-muted">Carregando...</p>}
        {txs?.length === 0 && <p className="py-2 text-sm text-muted">Nenhuma transação ainda.</p>}
        <ul>
          {txs?.map((t) => {
            const s = rowStyle(t.type);
            return (
              <li
                key={t.id}
                className="-mx-2 flex items-center justify-between rounded-xl px-2 py-3 transition hover:bg-panel2"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`flex h-9 w-9 items-center justify-center rounded-[11px] font-display text-base font-bold ${s.chip}`}
                  >
                    {s.glyph}
                  </div>
                  <div>
                    <p className="text-[13.5px] font-semibold">{txLabel(t.type)}</p>
                    <p className="text-[11.5px] text-muted">{formatDate(t.created_at)}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`font-display text-sm font-semibold ${s.tone}`}>
                    {s.sign} {formatBRL(t.amount)}
                  </p>
                  {t.fee > 0 && <p className="text-[11px] text-muted">tarifa {formatBRL(t.fee)}</p>}
                  <p className="text-[11px] text-muted">saldo {formatBRL(t.balance_after)}</p>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
