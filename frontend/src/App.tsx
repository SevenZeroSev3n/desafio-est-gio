import { useCallback, useEffect, useState } from "react";
import { bankApi } from "./api/bankApi";
import { AccountCard } from "./components/AccountCard";
import { WithdrawModal } from "./components/WithdrawModal";
import { TransferPanel } from "./components/TransferPanel";
import { HistoryPanel } from "./components/HistoryPanel";
import type { Account } from "./types";

export default function App() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [withdrawTarget, setWithdrawTarget] = useState<Account | null>(null);
  const [historyTarget, setHistoryTarget] = useState<Account | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      setAccounts(await bankApi.listAccounts());
      setLoadError(null);
    } catch {
      setLoadError("Não foi possível carregar as contas. O backend está rodando na porta 3001?");
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  function handleDone(message: string) {
    setToast(message);
    setWithdrawTarget(null);
    refresh();
    window.setTimeout(() => setToast(null), 6000);
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">Banco 🏦</h1>
        <p className="mt-1 text-slate-500">Saque e transferência sobre contas corrente e poupança.</p>
      </header>

      {loadError && (
        <div className="mb-6 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {loadError}
        </div>
      )}

      {toast && (
        <div className="mb-6 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          {toast}
        </div>
      )}

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {accounts.map((a) => (
          <AccountCard
            key={a.id}
            account={a}
            onWithdraw={setWithdrawTarget}
            onShowHistory={setHistoryTarget}
          />
        ))}
      </section>

      <section className="mt-8">
        <TransferPanel accounts={accounts} onDone={handleDone} />
      </section>

      {withdrawTarget && (
        <WithdrawModal
          account={withdrawTarget}
          onClose={() => setWithdrawTarget(null)}
          onDone={handleDone}
        />
      )}

      {historyTarget && (
        <HistoryPanel account={historyTarget} onClose={() => setHistoryTarget(null)} />
      )}
    </div>
  );
}
