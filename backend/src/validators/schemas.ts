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

const ownerName = z
  .string()
  .trim()
  .min(1, "nome é obrigatório")
  .max(100, "nome deve ter no máximo 100 caracteres");

// Criação de conta: valida apenas o shape. O dono vem como owner_id (titular
// existente) OU owner_name (titular novo), exatamente um. A regra "saldo inicial
// >= 0" e a existência do owner_id são de negócio e ficam no AccountService.
export const createAccountSchema = z
  .object({
    type: z.enum(["checking", "savings"]),
    balance: z
      .number({ invalid_type_error: "balance deve ser um número" })
      .refine(hasAtMostTwoDecimals, { message: "balance deve ter no máximo 2 casas decimais" })
      .default(0),
    owner_id: z.number().int().positive().optional(),
    owner_name: ownerName.optional(),
  })
  .refine((d) => (d.owner_id !== undefined) !== (d.owner_name !== undefined), {
    message: "informe owner_id ou owner_name (exatamente um)",
    path: ["owner"],
  });
