import { useState, type FormEvent } from "react";
import { bankApi, ApiRequestError } from "../api/bankApi";
import type { Account, AccountType } from "../types";

interface Props {
  onClose: () => void;
  onCreated: (account: Account) => void;
}

/** Modal de criação de conta. Valida o básico no cliente; a regra (saldo>=0) é do backend. */
export function NewAccountModal({ onClose, onCreated }: Props) {
  const [name, setName] = useState("");
  const [type, setType] = useState<AccountType>("checking");
  const [balance, setBalance] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (name.trim() === "") {
      setError("Informe o nome do titular.");
      return;
    }
    // Saldo vazio = 0 (default). Caso contrário, envia o número digitado.
    const initialBalance = balance.trim() === "" ? 0 : Number(balance);
    if (!Number.isFinite(initialBalance)) {
      setError("Saldo inicial inválido.");
      return;
    }

    setLoading(true);
    try {
      const acc = await bankApi.createAccount(name.trim(), type, initialBalance);
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

        <label className="mt-4 block text-sm font-medium text-slate-700">Nome do titular</label>
        <input
          autoFocus
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={100}
          className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
          placeholder="Ex.: Ana Lima"
        />

        <span className="mt-4 block text-sm font-medium text-slate-700">Tipo</span>
        <div className="mt-1 flex gap-4">
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input
              type="radio"
              name="type"
              checked={type === "checking"}
              onChange={() => setType("checking")}
            />
            Conta Corrente
          </label>
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input
              type="radio"
              name="type"
              checked={type === "savings"}
              onChange={() => setType("savings")}
            />
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
