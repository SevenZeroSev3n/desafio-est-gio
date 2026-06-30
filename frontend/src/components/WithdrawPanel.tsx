import { useState, type FormEvent } from "react";
import { bankApi, ApiRequestError } from "../api/bankApi";
import { formatBRL } from "../format";
import type { Account } from "../types";

interface Props {
  account: Account;
  onDone: (message: string) => void;
}

/** Form de saque inline, ligado a conta ativa. As regras (tarifa/limite) vivem no backend. */
export function WithdrawPanel({ account, onDone }: Props) {
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
      setAmount("");
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : "Falha ao sacar.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={submit} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <h3 className="font-semibold text-slate-900">Saque</h3>
      {account.type === "checking" && (
        <p className="mt-1 text-xs text-slate-400">Tarifa de R$ 1,00 por saque · cheque especial até -R$ 500,00</p>
      )}

      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="sm:flex-1">
          <label className="block text-sm font-medium text-slate-700">Valor (R$)</label>
          <input
            type="number"
            step="0.01"
            min="0"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0,00"
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
        >
          {loading ? "Processando..." : "Sacar"}
        </button>
      </div>

      {error && <p className="mt-3 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>}
    </form>
  );
}
