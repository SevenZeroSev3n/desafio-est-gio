import { useCallback, useEffect, useState } from "react";
import { bankApi } from "./api/bankApi";
import { AccountSelector } from "./components/AccountSelector";
import { AccountCard } from "./components/AccountCard";
import { WithdrawPanel } from "./components/WithdrawPanel";
import { TransferPanel } from "./components/TransferPanel";
import { HistoryPanel } from "./components/HistoryPanel";
import { NewAccountModal } from "./components/NewAccountModal";
import type { Account } from "./types";

export default function App() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [activeAccountId, setActiveAccountId] = useState<number | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [showNewAccount, setShowNewAccount] = useState(false);

  const refresh = useCallback(async () => {
    try {
      const list = await bankApi.listAccounts();
      setAccounts(list);
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

  function handleDone(message: string) {
    setToast(message);
    refresh();
    window.setTimeout(() => setToast(null), 6000);
  }

  function handleCreated(account: Account) {
    setShowNewAccount(false);
    setActiveAccountId(account.id); // auto-ativa a conta recém-criada
    handleDone(`Conta "${account.name}" criada.`);
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

      <section className="mb-6 flex flex-wrap items-end justify-between gap-3">
        {accounts.length > 0 ? (
          <AccountSelector
            accounts={accounts}
            activeAccountId={activeAccountId}
            onSelect={setActiveAccountId}
          />
        ) : (
          <span className="text-sm text-slate-500">Nenhuma conta cadastrada.</span>
        )}
        <button
          onClick={() => setShowNewAccount(true)}
          className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800"
        >
          + Nova conta
        </button>
      </section>

      {activeAccount ? (
        <>
          <section>
            <AccountCard account={activeAccount} />
          </section>

          <section className="mt-6">
            <WithdrawPanel account={activeAccount} onDone={handleDone} />
          </section>

          <section className="mt-6">
            <TransferPanel source={activeAccount} accounts={accounts} onDone={handleDone} />
          </section>

          <section className="mt-6">
            <HistoryPanel account={activeAccount} />
          </section>
        </>
      ) : (
        <p className="rounded-xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center text-slate-500">
          Nenhuma conta ainda. Use "+ Nova conta" para criar a primeira.
        </p>
      )}

      {showNewAccount && (
        <NewAccountModal onClose={() => setShowNewAccount(false)} onCreated={handleCreated} />
      )}
    </div>
  );
}
