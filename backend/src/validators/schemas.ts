import { z } from "zod";

// Valor monetário em reais: positivo e com no máximo 2 casas decimais.
const money = z
  .number({ invalid_type_error: "amount deve ser um número" })
  .positive("amount deve ser maior que zero")
  .refine((n) => Math.abs(n * 100 - Math.round(n * 100)) < 1e-9, {
    message: "amount deve ter no máximo 2 casas decimais",
  });

export const withdrawSchema = z.object({
  amount: money,
});

export const transferSchema = z.object({
  from_id: z.number().int().positive(),
  to_id: z.number().int().positive(),
  amount: money,
});

export const createAccountSchema = z.object({
  name: z.string().min(1),
  type: z.enum(["checking", "savings"]),
  balance: z.number().nonnegative().default(0),
});
