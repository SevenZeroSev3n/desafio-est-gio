/**
 * Dinheiro é manipulado internamente em centavos (inteiro) para evitar os
 * erros clássicos de ponto flutuante (0.1 + 0.2 !== 0.3). A API fala em reais
 * (number com casas decimais); a conversão acontece só na borda.
 */

/** Reais (ex.: 10.5) -> centavos inteiros (1050). */
export function toCents(reais: number): number {
  return Math.round(reais * 100);
}

/** Centavos inteiros (1050) -> reais (10.5). */
export function toReais(cents: number): number {
  return cents / 100;
}
