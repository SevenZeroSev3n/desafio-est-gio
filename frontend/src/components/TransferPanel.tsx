import { useState, type FormEvent } from "react";
import { bankApi, ApiRequestError } from "../api/bankApi";
import { formatBRL } from "../format";
import type { Account } from "../types";

interface Props {
  accounts: Account[];
  onDone: (message: string) => void;
}

export function TransferPanel({ accounts, onDone }: Props) {
  const [fromId, setFromId] = useState<number | "">("");
  const [toId, setToId] = useState<number | "">("");
  const [amount, setAmount] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    const value = Number(amount);
    if (fromId === "" || toId === "") return setError("Selecione as contas de origem e destino.");
    if (fromId === toId) return setError("Origem e destino devem ser diferentes.");
    if (!Number.isFinite(value) || value <= 0) return setError("Informe um valor maior que zero.");

    setLoading(true);
    try {
      const res = await bankApi.transfer(Number(fromId), Number(toId), value);
      const feeNote = res.fee_charged > 0 ? ` (tarifa ${formatBRL(res.fee_charged)})` : "";
      onDone(
        `Transferência de ${formatBRL(value)}${feeNote}. ${res.from.name}: ${formatBRL(res.from.balance)} · ${res.to.name}: ${formatBRL(res.to.balance)}.`,
      );
      setAmount("");
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : "Falha na transferência.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={submit} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <h3 className="font-semibold text-slate-900">Transferência</h3>
      <p className="mt-1 text-xs text-slate-400">A origem segue as regras do seu tipo de conta (tarifa/limite).</p>

      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <div>
          <label className="block text-sm font-medium text-slate-700">De</label>
          <select
            value={fromId}
            onChange={(e) => setFromId(e.target.value === "" ? "" : Number(e.target.value))}
            className="mt-1 w-full rounded-lg border border-slate-300 px-2 py-2 text-sm"
          >
            <option value="">Selecione</option>
            {accounts.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name} ({formatBRL(a.balance)})
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700">Para</label>
          <select
            value={toId}
            onChange={(e) => setToId(e.target.value === "" ? "" : Number(e.target.value))}
            className="mt-1 w-full rounded-lg border border-slate-300 px-2 py-2 text-sm"
          >
            <option value="">Selecione</option>
            {accounts.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name} ({formatBRL(a.balance)})
              </option>
            ))}
          </select>
        </div>
        <div>
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
      </div>

      {error && <p className="mt-3 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>}

      <button
        type="submit"
        disabled={loading}
        className="mt-4 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
      >
        {loading ? "Processando..." : "Transferir"}
      </button>
    </form>
  );
}
