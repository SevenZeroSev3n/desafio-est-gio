import type { Transaction } from "../types";
import { TxRow } from "./TxRow";

interface Props {
  ownerName: string;
  /** Histórico da conta ativa, ou null enquanto carrega. */
  txs: Transaction[] | null;
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
          {txs?.map((t) => (
            <TxRow key={t.id} tx={t} variant="full" />
          ))}
        </ul>
      </div>
    </section>
  );
}
