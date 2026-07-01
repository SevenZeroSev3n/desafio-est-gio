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
        `Transferência de ${formatBRL(value)}${feeNote}. ${res.from.owner.name}: ${formatBRL(res.from.balance)} · ${res.to.owner.name}: ${formatBRL(res.to.balance)}.`,
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
    <form
      onSubmit={submit}
      id="transferencia"
      className="scroll-mt-4 rounded-[20px] border border-border bg-panel p-6 shadow-panel"
    >
      <h3 className="font-display text-base font-bold">Transferência</h3>
      <p className="mt-1 text-[11.5px] leading-relaxed text-muted">
        A origem segue as regras do seu tipo de conta (tarifa/limite).
      </p>

      {destinations.length === 0 ? (
        <p className="mt-4 rounded-xl bg-panel2 px-3 py-2.5 text-sm text-muted">
          Não há outra conta para receber a transferência.
        </p>
      ) : (
        <>
          <label className="mt-4 block text-[11.5px] font-semibold text-muted">De</label>
          <div className="mt-1.5 rounded-xl border border-border bg-panel2 px-3.5 py-3 text-[13px] text-muted">
            {source.owner.name} · {accountTypeLabel(source.type)}
          </div>

          <label className="mt-3.5 block text-[11.5px] font-semibold text-muted">Para</label>
          <select
            value={toId}
            onChange={(e) => setToId(e.target.value === "" ? "" : Number(e.target.value))}
            className="mt-1.5 w-full rounded-xl border border-border px-3.5 py-3 text-[13px] outline-none focus:border-accent"
          >
            <option value="">Selecione</option>
            {destinations.map((a) => (
              <option key={a.id} value={a.id}>
                {a.owner.name} — {accountTypeLabel(a.type)} ({formatBRL(a.balance)})
              </option>
            ))}
          </select>

          <label className="mt-3.5 block text-[11.5px] font-semibold text-muted">Valor (R$)</label>
          <input
            type="number"
            step="0.01"
            min="0"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0,00"
            className="mt-1.5 w-full rounded-xl border border-border px-3.5 py-3 font-display text-[15px] font-semibold outline-none focus:border-accent"
          />

          {error && (
            <p className="mt-3 rounded-xl border border-neg/30 bg-neg/10 px-3 py-2 text-sm text-neg">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="mt-3 w-full rounded-xl bg-gradient-to-br from-accent to-accent2 py-3 text-sm font-semibold text-white transition hover:brightness-110 disabled:opacity-50"
          >
            {loading ? "Processando..." : "Transferir"}
          </button>
        </>
      )}
    </form>
  );
}
