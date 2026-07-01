import type { Transaction } from "../types";

/**
 * Agregações de EXIBIÇÃO sobre o histórico já retornado pelo backend. Não
 * recomputa tarifa, limite ou saldo — apenas soma valores que o backend já
 * calculou, para mostrar totais e desenhar a trajetória de saldo. A regra de
 * negócio continua inteira no backend.
 */
export interface HistorySummary {
  /** Total que entrou (transferências recebidas) no histórico carregado. */
  entradas: number;
  /** Total que saiu (saques + transferências enviadas, tarifa incluída). */
  saidas: number;
  /** Saldo após cada transação, em ordem cronológica (mais antigo → mais novo). */
  series: number[];
}

export function summarize(txs: Transaction[]): HistorySummary {
  let entradas = 0;
  let saidas = 0;
  for (const t of txs) {
    if (t.type === "transfer_in") entradas += t.amount;
    else saidas += t.amount + t.fee; // withdraw | transfer_out
  }
  // O backend devolve mais novo → mais antigo; invertemos para o gráfico.
  const series = txs.map((t) => t.balance_after).reverse();
  return { entradas, saidas, series };
}
