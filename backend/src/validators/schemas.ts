import { z } from "zod";

/** Verdadeiro se o valor em reais tem no máximo 2 casas decimais (representável em centavos inteiros). */
const hasAtMostTwoDecimals = (n: number) => Math.abs(n * 100 - Math.round(n * 100)) < 1e-9;

// Valor monetário de operação: positivo e com no máximo 2 casas decimais.
const money = z
  .number({ invalid_type_error: "amount deve ser um número" })
  .positive("amount deve ser maior que zero")
  .refine(hasAtMostTwoDecimals, { message: "amount deve ter no máximo 2 casas decimais" });

export const withdrawSchema = z.object({
  amount: money,
});

export const transferSchema = z.object({
  from_id: z.number().int().positive(),
  to_id: z.number().int().positive(),
  amount: money,
});

// Criação de conta: valida apenas o shape. A regra "saldo inicial >= 0" vive no
// AccountService (responde 422), não aqui — saldo negativo passa pelo shape e o
// service o rejeita como regra de negócio.
export const createAccountSchema = z.object({
  name: z.string().trim().min(1, "nome é obrigatório").max(100, "nome deve ter no máximo 100 caracteres"),
  type: z.enum(["checking", "savings"]),
  balance: z
    .number({ invalid_type_error: "balance deve ser um número" })
    .refine(hasAtMostTwoDecimals, { message: "balance deve ter no máximo 2 casas decimais" })
    .default(0),
});
