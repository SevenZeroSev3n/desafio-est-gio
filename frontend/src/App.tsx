import { useState } from "react";
import { Sidebar, type View } from "./components/Sidebar";
import { BalanceHero } from "./components/BalanceHero";
import { WithdrawPanel } from "./components/WithdrawPanel";
import { TransferPanel } from "./components/TransferPanel";
import { HistoryPanel } from "./components/HistoryPanel";
import { ContasScreen } from "./components/ContasScreen";
import { HistoricoScreen } from "./components/HistoricoScreen";
import { NewAccountModal } from "./components/NewAccountModal";
import { ManagerWallet } from "./components/ManagerWallet";
import { PixelField } from "./components/PixelField";
import { accountTypeLabel, formatBRL } from "./format";
import { useAccountsData } from "./hooks/useAccountsData";
import { useSelection } from "./hooks/useSelection";
import { useAccountHistory } from "./hooks/useAccountHistory";
import type { Account } from "./types";

export default function App() {
  const { accounts, titulares, loadError, refresh } = useAccountsData();
  const {
    clients,
    selectedClient,
    clientAccounts,
    activeAccount,
    activeId,
    selectClient,
    selectAccount,
    setSelectedClientId,
    setActiveAccountId,
  } = useSelection(accounts);
  const { txs, refetch: refetchHistory } = useAccountHistory(activeId);

  const [toast, setToast] = useState<string | null>(null);
  const [showNewAccount, setShowNewAccount] = useState(false);
  const [view, setView] = useState<View>("inicio");

  function handleDone(message: string) {
    setToast(message);
    refresh();
    refetchHistory();
    window.setTimeout(() => setToast(null), 6000);
  }

  function handleCreated(account: Account) {
    setShowNewAccount(false);
    setSelectedClientId(account.owner.id);
    setActiveAccountId(account.id);
    setView("inicio");
    handleDone(`Conta de ${account.owner.name} criada.`);
  }

  const clientName = selectedClient?.name ?? "";
  const header: Record<View, { eyebrow: string; title: string }> = {
    inicio: { eyebrow: "Início", title: clientName ? `Painel de ${clientName}` : "Banco Agilize" },
    contas: { eyebrow: `Contas de ${clientName}`, title: "Contas" },
    historico: { eyebrow: `Extrato de ${clientName}`, title: "Histórico" },
    carteira: { eyebrow: "Acesso de gerente", title: "Carteira do gerente" },
  };

  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      <PixelField />

      {clients.length > 0 ? (
        <Sidebar
          clients={clients}
          selectedClientId={selectedClient?.id ?? null}
          onSelectClient={selectClient}
          view={view}
          onNavigate={setView}
          onNewAccount={() => setShowNewAccount(true)}
        />
      ) : (
        <aside className="flex w-full items-center gap-3 border-border bg-panel p-5 md:w-[248px] md:flex-none md:border-r">
          <div className="h-9 w-9 rounded-[10px] bg-gradient-to-br from-accent to-accent2" />
          <span className="font-display text-base font-bold">Agilize</span>
        </aside>
      )}

      <main className="min-w-0 flex-1 px-5 py-7 md:px-8">
        <header className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-[13px] text-muted">{header[view].eyebrow}</div>
            <h1 className="font-display text-2xl font-bold leading-tight">{header[view].title}</h1>
          </div>

          <div className="flex items-center gap-2.5">
            {view === "inicio" && clientAccounts.length > 0 && (
              <select
                value={activeId ?? undefined}
                onChange={(e) => selectAccount(Number(e.target.value))}
                className="rounded-xl border border-border bg-panel px-3.5 py-2.5 text-[13px] font-semibold text-text"
              >
                {clientAccounts.map((a) => (
                  <option key={a.id} value={a.id}>
                    {accountTypeLabel(a.type)} · {formatBRL(a.balance)}
                  </option>
                ))}
              </select>
            )}
            {(view === "inicio" || view === "contas") && (
              <button
                onClick={() => setShowNewAccount(true)}
                className="rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-white transition hover:brightness-110"
              >
                + Nova conta
              </button>
            )}
          </div>
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

        {view === "carteira" ? (
          <ManagerWallet />
        ) : view === "contas" ? (
          <ContasScreen
            accounts={clientAccounts}
            activeAccountId={activeId}
            onSelect={selectAccount}
            txs={txs}
          />
        ) : view === "historico" ? (
          activeAccount ? (
            <HistoricoScreen account={activeAccount} txs={txs} />
          ) : (
            <p className="rounded-[20px] border border-dashed border-border bg-panel px-6 py-12 text-center text-muted">
              Selecione uma conta para ver o histórico.
            </p>
          )
        ) : activeAccount ? (
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
