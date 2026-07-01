import type { Account, Transaction } from "../types";
import { accountTypeLabel, formatBRL, formatDate, txLabel } from "../format";

interface Props {
  accounts: Account[];
  activeAccountId: number | null;
  onSelect: (id: number) => void;
  txs: Transaction[] | null;
}

/** Estilo do valor de uma transação: entrada (verde) vs saída (vermelho). */
function rowTone(type: Transaction["type"]) {
  return type === "transfer_in"
    ? { sign: "+", glyph: "↓", tone: "text-pos", chip: "bg-pos/15 text-pos" }
    : { sign: "−", glyph: "↑", tone: "text-neg", chip: "bg-neg/15 text-neg" };
}

/**
 * Tela "Contas": lista as contas do cliente ativo (esquerda) e o detalhe da
 * conta selecionada (direita), com movimentações recentes. Só exibe dados reais.
 */
export function ContasScreen({ accounts, activeAccountId, onSelect, txs }: Props) {
  const active = accounts.find((a) => a.id === activeAccountId) ?? accounts[0] ?? null;

  if (!active) {
    return (
      <p className="rounded-[20px] border border-dashed border-border bg-panel px-6 py-12 text-center text-muted">
        Este cliente ainda não tem contas.
      </p>
    );
  }

  return (
    <div className="grid items-start gap-5 lg:grid-cols-[340px_1fr]">
      <div className="flex flex-col gap-1.5 rounded-[20px] border border-border bg-panel p-3.5 shadow-panel">
        {accounts.map((a) => {
          const on = a.id === active.id;
          const negative = a.balance < 0;
          return (
            <button
              key={a.id}
              type="button"
              onClick={() => onSelect(a.id)}
              aria-current={on ? "true" : undefined}
              className={`flex items-center justify-between gap-2.5 rounded-2xl border px-3 py-3 text-left transition ${
                on ? "border-accent bg-panel2" : "border-border hover:bg-panel2"
              }`}
            >
              <span className="flex min-w-0 items-center gap-3">
                <span className="flex h-9 w-9 flex-none items-center justify-center rounded-[11px] bg-chip font-display text-[15px] font-bold text-accent">
                  {a.type === "checking" ? "C" : "P"}
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-[13.5px] font-semibold">
                    {accountTypeLabel(a.type)}
                  </span>
                  <span className="block text-[11.5px] text-muted">#{a.id}</span>
                </span>
              </span>
              <span
                className={`font-display text-[13px] font-semibold tabular-nums ${negative ? "text-neg" : ""}`}
              >
                {formatBRL(a.balance)}
              </span>
            </button>
          );
        })}
      </div>

      <div className="rounded-[20px] border border-border bg-panel p-6 shadow-panel">
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-chip px-2.5 py-1 text-[10.5px] font-semibold text-accent">
            {accountTypeLabel(active.type)}
          </span>
          <span className="rounded-full bg-pos/15 px-2.5 py-1 text-[10.5px] font-semibold text-pos">
            Ativa
          </span>
        </div>
        <h2 className="mt-3 font-display text-[22px] font-bold">{active.owner.name}</h2>
        <div className="text-[12.5px] text-muted">Conta #{active.id}</div>
        <p
          className={`mt-4 font-display text-[40px] font-bold leading-none tracking-tight ${
            active.balance < 0 ? "text-neg" : ""
          }`}
        >
          {formatBRL(active.balance)}
        </p>

        <div className="mt-6 border-t border-border pt-5">
          <div className="mb-2.5 font-display text-[13.5px] font-bold">Movimentações recentes</div>
          {txs === null && <p className="py-2 text-sm text-muted">Carregando...</p>}
          {txs?.length === 0 && <p className="py-2 text-sm text-muted">Nenhuma movimentação ainda.</p>}
          <ul>
            {txs?.slice(0, 5).map((t) => {
              const s = rowTone(t.type);
              return (
                <li key={t.id} className="flex items-center justify-between border-b border-border py-2.5">
                  <div className="flex items-center gap-3">
                    <div
                      className={`flex h-8 w-8 items-center justify-center rounded-[9px] font-display text-[13px] font-bold ${s.chip}`}
                    >
                      {s.glyph}
                    </div>
                    <div>
                      <p className="text-[12.5px] font-semibold">{txLabel(t.type)}</p>
                      <p className="text-[11px] text-muted">{formatDate(t.created_at)}</p>
                    </div>
                  </div>
                  <span className={`font-display text-[12.5px] font-semibold ${s.tone}`}>
                    {s.sign} {formatBRL(t.amount)}
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </div>
  );
}
