import { useEffect, useState } from "react";
import { bankApi, ApiRequestError } from "../api/bankApi";
import { formatBRL, formatDate } from "../format";
import type { Account, Transaction } from "../types";

/**
 * Carteira interna do gerente: o saldo acumulado das tarifas cobradas nas contas
 * corrente, mais o extrato dessas tarifas. Só exibe — os números vêm de
 * /api/manager. Auto-busca ao montar (ao abrir a aba). Trata o caso de a conta
 * do gerente ainda não existir (bank.db antigo): orienta a recriar o banco.
 */
export function ManagerWallet() {
  const [wallet, setWallet] = useState<Account | null>(null);
  const [txs, setTxs] = useState<Transaction[] | null>(null);
  const [missing, setMissing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    Promise.all([bankApi.getManagerWallet(), bankApi.managerHistory()])
      .then(([w, h]) => {
        if (!active) return;
        setWallet(w);
        setTxs(h);
      })
      .catch((err) => {
        if (!active) return;
        if (err instanceof ApiRequestError && err.code === "MANAGER_NOT_FOUND") {
          setMissing(true);
        } else {
          setError("Não foi possível carregar a carteira do gerente.");
        }
      });
    return () => {
      active = false;
    };
  }, []);

  if (missing) {
    return (
      <section className="rounded-[20px] border border-dashed border-border bg-panel px-6 py-12 text-center shadow-panel">
        <p className="font-display text-base font-bold">Carteira ainda não inicializada</p>
        <p className="mx-auto mt-2 max-w-md text-sm text-muted">
          A conta do gerente é criada ao popular um banco novo. Remova{" "}
          <code className="rounded bg-panel2 px-1.5 py-0.5 text-[12px]">backend/bank.db</code> e reinicie
          o backend para criá-la.
        </p>
      </section>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-neg/30 bg-neg/10 px-4 py-3 text-sm text-neg">{error}</div>
    );
  }

  const count = txs?.length ?? 0;

  return (
    <div className="flex flex-col gap-5">
      <section className="rounded-[20px] border border-border bg-panel p-6 pb-5 shadow-panel">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted">Tarifas acumuladas</span>
            <span className="rounded-full bg-chip px-2.5 py-1 text-[10.5px] font-semibold text-accent">
              Carteira do gerente
            </span>
          </div>
          <span className="text-xs text-muted">interna</span>
        </div>

        <p className="mt-2 font-display text-[40px] font-bold leading-none tracking-tight">
          {wallet ? formatBRL(wallet.balance) : "—"}
        </p>
        <p className="mt-3 text-[12.5px] text-muted">
          {count === 0
            ? "Nenhuma tarifa coletada ainda."
            : `${count} ${count === 1 ? "tarifa coletada" : "tarifas coletadas"} das contas corrente (R$ 1,00 por operação).`}
        </p>
      </section>

      <section className="rounded-[20px] border border-border bg-panel p-6 shadow-panel">
        <h3 className="font-display text-base font-bold">Tarifas recebidas</h3>
        <div className="mt-3 max-h-96 overflow-y-auto">
          {txs === null && <p className="py-2 text-sm text-muted">Carregando...</p>}
          {txs?.length === 0 && <p className="py-2 text-sm text-muted">Nenhuma tarifa ainda.</p>}
          <ul>
            {txs?.map((t) => (
              <li
                key={t.id}
                className="-mx-2 flex items-center justify-between rounded-xl px-2 py-3 transition hover:bg-panel2"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-[11px] bg-pos/15 font-display text-base font-bold text-pos">
                    ↓
                  </div>
                  <div>
                    <p className="text-[13.5px] font-semibold">Tarifa de operação</p>
                    <p className="text-[11.5px] text-muted">{formatDate(t.created_at)}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-display text-sm font-semibold text-pos">+ {formatBRL(t.amount)}</p>
                  <p className="text-[11px] text-muted">saldo {formatBRL(t.balance_after)}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </div>
  );
}
