import { test } from "node:test";
import assert from "node:assert/strict";
import Database from "better-sqlite3";
import { applySchema } from "../db/schema";
import { AppError } from "../errors";
import { toCents } from "../money";
import { AccountService } from "./AccountService";
import type { AccountType } from "../types";

/** Cria um banco em memória isolado com as contas dadas e devolve o service + ids. */
function setup(accounts: Array<{ name: string; type: AccountType; balance: number }>) {
  const db = new Database(":memory:");
  applySchema(db);
  const insert = db.prepare("INSERT INTO accounts (name, type, balance) VALUES (?, ?, ?)");
  const ids = accounts.map((a) => Number(insert.run(a.name, a.type, toCents(a.balance)).lastInsertRowid));
  return { service: new AccountService(db), db, ids };
}

function balanceOf(db: Database.Database, id: number): number {
  return (db.prepare("SELECT balance FROM accounts WHERE id = ?").get(id) as { balance: number }).balance;
}

/** Captura o `code` do AppError lançado por `fn`. */
function codeOfThrow(fn: () => void): string {
  try {
    fn();
  } catch (err) {
    assert.ok(err instanceof AppError, "esperava AppError");
    return err.code;
  }
  assert.fail("esperava que lançasse, mas não lançou");
}

// --- R1: conta corrente ---

test("R1: saque em corrente cobra tarifa de R$ 1 além do valor", () => {
  const { service, db, ids } = setup([{ name: "A", type: "checking", balance: 1000 }]);
  const res = service.withdraw(ids[0], 100);
  assert.equal(res.balance, 899); // 1000 - 100 - 1
  assert.equal(res.fee_charged, 1);
  assert.equal(balanceOf(db, ids[0]), toCents(899));
});

test("R1: saldo pode chegar exatamente a -R$ 500 (limite do cheque especial)", () => {
  const { service, ids } = setup([{ name: "A", type: "checking", balance: 0 }]);
  const res = service.withdraw(ids[0], 499); // 0 - 499 - 1 = -500
  assert.equal(res.balance, -500);
});

test("R1: saque que passaria de -R$ 500 é negado e não altera saldo", () => {
  const { service, db, ids } = setup([{ name: "A", type: "checking", balance: 0 }]);
  assert.equal(codeOfThrow(() => service.withdraw(ids[0], 499.01)), "INSUFFICIENT_FUNDS");
  assert.equal(balanceOf(db, ids[0]), 0);
});

// --- R2: conta poupança ---

test("R2: poupança não tem tarifa e pode zerar o saldo", () => {
  const { service, ids } = setup([{ name: "A", type: "savings", balance: 800 }]);
  const res = service.withdraw(ids[0], 800);
  assert.equal(res.balance, 0);
  assert.equal(res.fee_charged, 0);
});

test("R2: poupança não pode ficar negativa", () => {
  const { service, db, ids } = setup([{ name: "A", type: "savings", balance: 800 }]);
  assert.equal(codeOfThrow(() => service.withdraw(ids[0], 800.01)), "SAVINGS_NEGATIVE_BALANCE");
  assert.equal(balanceOf(db, ids[0]), toCents(800));
});

// --- validação ---

test("saque de valor <= 0 é rejeitado", () => {
  const { service, ids } = setup([{ name: "A", type: "checking", balance: 100 }]);
  assert.equal(codeOfThrow(() => service.withdraw(ids[0], 0)), "INVALID_AMOUNT");
});

test("conta inexistente lança ACCOUNT_NOT_FOUND", () => {
  const { service } = setup([]);
  assert.equal(codeOfThrow(() => service.withdraw(999, 10)), "ACCOUNT_NOT_FOUND");
});

// --- transferência ---

test("transferência: origem corrente paga tarifa, destino recebe valor integral", () => {
  const { service, db, ids } = setup([
    { name: "Origem", type: "checking", balance: 1000 },
    { name: "Destino", type: "savings", balance: 0 },
  ]);
  const res = service.transfer(ids[0], ids[1], 100);
  assert.equal(res.from.balance, 899); // 1000 - 100 - 1
  assert.equal(res.to.balance, 100);
  assert.equal(res.fee_charged, 1);
  assert.equal(balanceOf(db, ids[0]), toCents(899));
  assert.equal(balanceOf(db, ids[1]), toCents(100));
});

test("transferência: origem poupança é isenta de tarifa", () => {
  const { service, ids } = setup([
    { name: "Origem", type: "savings", balance: 100 },
    { name: "Destino", type: "checking", balance: 0 },
  ]);
  const res = service.transfer(ids[0], ids[1], 100);
  assert.equal(res.from.balance, 0);
  assert.equal(res.fee_charged, 0);
});

test("transferência inválida é atômica: nenhum saldo muda", () => {
  const { service, db, ids } = setup([
    { name: "Origem", type: "savings", balance: 50 },
    { name: "Destino", type: "checking", balance: 0 },
  ]);
  assert.equal(codeOfThrow(() => service.transfer(ids[0], ids[1], 51)), "SAVINGS_NEGATIVE_BALANCE");
  assert.equal(balanceOf(db, ids[0]), toCents(50));
  assert.equal(balanceOf(db, ids[1]), 0);
});

test("transferência para a mesma conta é rejeitada", () => {
  const { service, ids } = setup([{ name: "A", type: "checking", balance: 100 }]);
  assert.equal(codeOfThrow(() => service.transfer(ids[0], ids[0], 10)), "SAME_ACCOUNT");
});

// --- criação de conta ---

test("createAccount: cria corrente com saldo inicial e persiste em centavos", () => {
  const { service, db } = setup([]);
  const acc = service.createAccount("Ana", "checking", 100.5);
  assert.equal(acc.name, "Ana");
  assert.equal(acc.type, "checking");
  assert.equal(acc.balance, 100.5);
  assert.equal(balanceOf(db, acc.id), toCents(100.5)); // 10050
});

test("createAccount: saldo inicial 0 cria poupança zerada", () => {
  const { service } = setup([]);
  const acc = service.createAccount("Bia", "savings", 0);
  assert.equal(acc.type, "savings");
  assert.equal(acc.balance, 0);
});

test("createAccount: saldo inicial negativo é rejeitado (regra de negócio)", () => {
  const { service } = setup([]);
  assert.equal(
    codeOfThrow(() => service.createAccount("Caio", "checking", -0.01)),
    "NEGATIVE_INITIAL_BALANCE",
  );
});

test("createAccount: saldo com 2 casas não sofre drift de float", () => {
  const { service, db } = setup([]);
  const acc = service.createAccount("Dora", "savings", 99.99);
  assert.equal(acc.balance, 99.99);
  assert.equal(balanceOf(db, acc.id), 9999);
});
