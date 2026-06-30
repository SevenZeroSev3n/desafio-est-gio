import { useCallback, useEffect, useState } from "react";
import { bankApi } from "./api/bankApi";
import { Sidebar } from "./components/Sidebar";
import { BalanceHero } from "./components/BalanceHero";
import { WithdrawPanel } from "./components/WithdrawPanel";
import { TransferPanel } from "./components/TransferPanel";
import { HistoryPanel } from "./components/HistoryPanel";
import { NewAccountModal } from "./components/NewAccountModal";
import { PixelField } from "./components/PixelField";
import type { Account, Titular, Transaction } from "./types";

export default function App() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [titulares, setTitulares] = useState<Titular[]>([]);
  const [activeAccountId, setActiveAccountId] = useState<number | null>(null);
  const [txs, setTxs] = useState<Transaction[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [showNewAccount, setShowNewAccount] = useState(false);

  const refresh = useCallback(async () => {
    try {
      const [list, owners] = await Promise.all([bankApi.listAccounts(), bankApi.listTitulares()]);
      setAccounts(list);
      setTitulares(owners);
      // Preserva a conta ativa por id; se ela sumiu (ou nao havia), cai na primeira.
      setActiveAccountId((prev) =>
        prev !== null && list.some((a) => a.id === prev) ? prev : list[0]?.id ?? null,
      );
      setLoadError(null);
    } catch {
      setLoadError("Não foi possível carregar as contas. O backend está rodando na porta 3001?");
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const activeAccount = accounts.find((a) => a.id === activeAccountId) ?? null;

  // Histórico da conta ativa, levantado aqui para o herói (sparkline/totais) e o
  // painel de histórico compartilharem um único fetch. Guard de corrida: trocar
  // de conta rápido pode resolver respostas fora de ordem.
  useEffect(() => {
    if (activeAccountId === null) {
      setTxs(null);
      return;
    }
    let active = true;
    setTxs(null);
    bankApi
      .history(activeAccountId)
      .then((data) => active && setTxs(data))
      .catch(() => active && setTxs([]));
    return () => {
      active = false;
    };
  }, [activeAccountId]);

  function handleDone(message: string) {
    setToast(message);
    refresh();
    window.setTimeout(() => setToast(null), 6000);
  }

  function handleCreated(account: Account) {
    setShowNewAccount(false);
    setActiveAccountId(account.id); // auto-ativa a conta recém-criada
    handleDone(`Conta de ${account.owner.name} criada.`);
  }

  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      <PixelField />

      {accounts.length > 0 ? (
        <Sidebar
          accounts={accounts}
          activeAccountId={activeAccountId}
          onSelect={setActiveAccountId}
          onNewAccount={() => setShowNewAccount(true)}
        />
      ) : (
        <aside className="flex w-full items-center gap-3 border-border bg-panel p-5 md:w-[236px] md:flex-none md:border-r">
          <div className="h-9 w-9 rounded-[10px] bg-gradient-to-br from-accent to-accent2" />
          <span className="font-display text-base font-bold">Agilize</span>
        </aside>
      )}

      <main className="min-w-0 flex-1 px-5 py-7 md:px-8">
        <header className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-[13px] text-muted">Painel</div>
            <h1 className="font-display text-2xl font-bold leading-tight">Banco Agilize</h1>
          </div>
          <button
            onClick={() => setShowNewAccount(true)}
            className="rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-white transition hover:brightness-110"
          >
            + Nova conta
          </button>
        </header>

        {loadError && (
          <div className="mb-6 rounded-xl border border-neg/30 bg-neg/10 px-4 py-3 text-sm text-neg">
            {loadError}
          </div>
        )}

        {toast && (
          <div className="mb-6 rounded-xl border border-pos/30 bg-pos/10 px-4 py-3 text-sm text-pos">
            {toast}
          </div>
        )}

        {activeAccount ? (
          <div className="grid items-start gap-5 lg:grid-cols-[1.55fr_1fr]">
            <div className="flex min-w-0 flex-col gap-5">
              <BalanceHero account={activeAccount} txs={txs} />
              <HistoryPanel ownerName={activeAccount.owner.name} txs={txs} />
            </div>
            <div className="flex min-w-0 flex-col gap-5">
              <WithdrawPanel account={activeAccount} onDone={handleDone} />
              <TransferPanel source={activeAccount} accounts={accounts} onDone={handleDone} />
            </div>
          </div>
        ) : (
          <p className="rounded-[20px] border border-dashed border-border bg-panel px-6 py-12 text-center text-muted">
            Nenhuma conta ainda. Use "+ Nova conta" para criar a primeira.
          </p>
        )}
      </main>

      {showNewAccount && (
        <NewAccountModal
          titulares={titulares}
          onClose={() => setShowNewAccount(false)}
          onCreated={handleCreated}
        />
      )}
    </div>
  );
}
