import type { Transaction } from "../types";

export function isEntrada(type: Transaction["type"]) {
  return type === "transfer_in";
}

/** Estilo visual de uma transação a partir do tipo: entrada (verde) vs saída (vermelho). */
export function txStyle(type: Transaction["type"]) {
  return isEntrada(type)
    ? { sign: "+", glyph: "↓", tone: "text-pos", chip: "bg-pos/15 text-pos" }
    : { sign: "−", glyph: "↑", tone: "text-neg", chip: "bg-neg/15 text-neg" };
}
