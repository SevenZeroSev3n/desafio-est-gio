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
    <form
      onSubmit={submit}
      id="saque"
      className="scroll-mt-4 rounded-[20px] border border-border bg-panel p-6 shadow-panel"
    >
      <h3 className="font-display text-base font-bold">Saque</h3>
      {account.type === "checking" && (
        <p className="mt-1 text-[11px] leading-relaxed text-muted">
          Tarifa de R$ 1,00 por saque · cheque especial até −R$ 500,00
        </p>
      )}

      <label className="mt-4 block text-[11.5px] font-semibold text-muted">Valor (R$)</label>
      <input
        type="number"
        step="0.01"
        min="0"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        placeholder="0,00"
        className="mt-1.5 w-full rounded-xl border border-border px-3.5 py-3 font-display text-[15px] font-semibold outline-none focus:border-accent"
      />
      <button
        type="submit"
        disabled={loading}
        className="mt-3 w-full rounded-xl bg-accent py-3 text-sm font-semibold text-white transition hover:brightness-110 disabled:opacity-50"
      >
        {loading ? "Processando..." : "Sacar"}
      </button>

      {error && (
        <p className="mt-3 rounded-xl border border-neg/30 bg-neg/10 px-3 py-2 text-sm text-neg">{error}</p>
      )}
    </form>
  );
}
