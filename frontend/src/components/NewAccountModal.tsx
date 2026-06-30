import { useState, type FormEvent } from "react";
import { bankApi, ApiRequestError } from "../api/bankApi";
import type { Account, AccountType, Titular } from "../types";

interface Props {
  titulares: Titular[];
  onClose: () => void;
  onCreated: (account: Account) => void;
}

/** Modal de criação de conta: titular existente (dropdown) ou novo (nome). A regra (saldo>=0) é do backend. */
export function NewAccountModal({ titulares, onClose, onCreated }: Props) {
  const [mode, setMode] = useState<"existing" | "new">(titulares.length > 0 ? "existing" : "new");
  const [ownerId, setOwnerId] = useState<number | "">(titulares[0]?.id ?? "");
  const [ownerName, setOwnerName] = useState("");
  const [type, setType] = useState<AccountType>("checking");
  const [balance, setBalance] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    let owner: { id: number } | { name: string };
    if (mode === "existing") {
      if (ownerId === "") return setError("Selecione um titular.");
      owner = { id: Number(ownerId) };
    } else {
      if (ownerName.trim() === "") return setError("Informe o nome do titular.");
      owner = { name: ownerName.trim() };
    }

    // Saldo vazio = 0 (default). Caso contrário, envia o número digitado.
    const initialBalance = balance.trim() === "" ? 0 : Number(balance);
    if (!Number.isFinite(initialBalance)) return setError("Saldo inicial inválido.");

    setLoading(true);
    try {
      const acc = await bankApi.createAccount({ type, balance: initialBalance, owner });
      onCreated(acc);
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : "Falha ao criar conta.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-10 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <form
        onClick={(e) => e.stopPropagation()}
        onSubmit={submit}
        className="w-full max-w-sm rounded-xl bg-white p-6 shadow-xl"
      >
        <h2 className="text-lg font-semibold text-slate-900">Nova conta</h2>

        <span className="mt-4 block text-sm font-medium text-slate-700">Titular</span>
        <div className="mt-1 flex gap-4">
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input
              type="radio"
              name="owner-mode"
              checked={mode === "existing"}
              disabled={titulares.length === 0}
              onChange={() => setMode("existing")}
            />
            Existente
          </label>
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input
              type="radio"
              name="owner-mode"
              checked={mode === "new"}
              onChange={() => setMode("new")}
            />
            Novo
          </label>
        </div>

        {mode === "existing" ? (
          <select
            value={ownerId}
            onChange={(e) => setOwnerId(e.target.value === "" ? "" : Number(e.target.value))}
            className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          >
            <option value="">Selecione</option>
            {titulares.map((t) => (
              <option key={t.id} value={t.id}>
                {t.nome}
              </option>
            ))}
          </select>
        ) : (
          <input
            autoFocus
            value={ownerName}
            onChange={(e) => setOwnerName(e.target.value)}
            maxLength={100}
            className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
            placeholder="Nome do titular"
          />
        )}

        <span className="mt-4 block text-sm font-medium text-slate-700">Tipo</span>
        <div className="mt-1 flex gap-4">
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input type="radio" name="type" checked={type === "checking"} onChange={() => setType("checking")} />
            Conta Corrente
          </label>
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input type="radio" name="type" checked={type === "savings"} onChange={() => setType("savings")} />
            Conta Poupança
          </label>
        </div>

        <label className="mt-4 block text-sm font-medium text-slate-700">Saldo inicial (R$)</label>
        <input
          type="number"
          step="0.01"
          min="0"
          value={balance}
          onChange={(e) => setBalance(e.target.value)}
          className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
          placeholder="0,00 (opcional)"
        />

        {error && <p className="mt-3 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>}

        <div className="mt-5 flex justify-end gap-2">
          <button type="button" onClick={onClose} className="rounded-lg px-4 py-2 text-sm text-slate-600 hover:bg-slate-100">
            Cancelar
          </button>
          <button
            type="submit"
            disabled={loading}
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
          >
            {loading ? "Criando..." : "Criar conta"}
          </button>
        </div>
      </form>
    </div>
  );
}
