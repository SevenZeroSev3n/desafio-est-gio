import { useState, type FormEvent } from "react";
import { bankApi, ApiRequestError } from "../api/bankApi";
import { accountTypeLabel, formatBRL } from "../format";
import type { Account } from "../types";

interface Props {
  /** Origem travada: a conta ativa. As regras do tipo da origem (tarifa/limite) valem aqui. */
  source: Account;
  accounts: Account[];
  onDone: (message: string) => void;
}

export function TransferPanel({ source, accounts, onDone }: Props) {
  const destinations = accounts.filter((a) => a.id !== source.id);
  const [toId, setToId] = useState<number | "">("");
  const [amount, setAmount] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    const value = Number(amount);
    if (toId === "") return setError("Selecione a conta de destino.");
    if (!Number.isFinite(value) || value <= 0) return setError("Informe um valor maior que zero.");

    setLoading(true);
    try {
      const res = await bankApi.transfer(source.id, Number(toId), value);
      const feeNote = res.fee_charged > 0 ? ` (tarifa ${formatBRL(res.fee_charged)})` : "";
      onDone(
        `Transferência de ${formatBRL(value)}${feeNote}. ${res.from.name}: ${formatBRL(res.from.balance)} · ${res.to.name}: ${formatBRL(res.to.balance)}.`,
      );
      setAmount("");
      setToId("");
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

      {destinations.length === 0 ? (
        <p className="mt-4 rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-500">
          Não há outra conta para receber a transferência.
        </p>
      ) : (
        <>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <div>
              <span className="block text-sm font-medium text-slate-700">De</span>
              <p className="mt-1 rounded-lg bg-slate-50 px-2 py-2 text-sm text-slate-600">
                {source.name} · {accountTypeLabel(source.type)}
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">Para</label>
              <select
                value={toId}
                onChange={(e) => setToId(e.target.value === "" ? "" : Number(e.target.value))}
                className="mt-1 w-full rounded-lg border border-slate-300 px-2 py-2 text-sm"
              >
                <option value="">Selecione</option>
                {destinations.map((a) => (
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
        </>
      )}
    </form>
  );
}
