import { useState, type FormEvent } from "react";
import { bankApi, ApiRequestError } from "../api/bankApi";
import { accountTypeLabel, formatBRL } from "../format";
import type { Account } from "../types";

interface Props {
  account: Account;
  onClose: () => void;
  onDone: (message: string) => void;
}

export function WithdrawModal({ account, onClose, onDone }: Props) {
  const [amount, setAmount] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    const value = Number(amount);
    if (!Number.isFinite(value) || value <= 0) {
      setError("Informe um valor maior que zero.");
      return;
    }
    setLoading(true);
    try {
      const res = await bankApi.withdraw(account.id, value);
      const feeNote = res.fee_charged > 0 ? ` (tarifa ${formatBRL(res.fee_charged)})` : "";
      onDone(`Saque de ${formatBRL(value)}${feeNote}. Novo saldo: ${formatBRL(res.balance)}.`);
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : "Falha ao sacar.");
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
        <h2 className="text-lg font-semibold text-slate-900">Sacar de {account.name}</h2>
        <p className="mt-1 text-sm text-slate-500">
          {accountTypeLabel(account.type)} · saldo atual {formatBRL(account.balance)}
        </p>
        {account.type === "checking" && (
          <p className="mt-1 text-xs text-slate-400">Tarifa de R$ 1,00 por saque · cheque especial até -R$ 500,00</p>
        )}

        <label className="mt-4 block text-sm font-medium text-slate-700">Valor (R$)</label>
        <input
          type="number"
          step="0.01"
          min="0"
          autoFocus
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-indigo-500 focus:outline-none"
          placeholder="0,00"
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
            {loading ? "Processando..." : "Confirmar saque"}
          </button>
        </div>
      </form>
    </div>
  );
}
