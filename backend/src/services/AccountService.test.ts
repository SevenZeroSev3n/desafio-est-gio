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
  const insTitular = db.prepare("INSERT INTO titulares (nome) VALUES (?)");
  const insAccount = db.prepare("INSERT INTO accounts (owner_id, type, balance) VALUES (?, ?, ?)");
  const ids = accounts.map((a) => {
    const ownerId = Number(insTitular.run(a.name).lastInsertRowid);
    return Number(insAccount.run(ownerId, a.type, toCents(a.balance)).lastInsertRowid);
  });
  return { service: new AccountService(db), db, ids };
}

function countTitulares(db: Database.Database): number {
  return (db.prepare("SELECT COUNT(*) AS c FROM titulares").get() as { c: number }).c;
}

function ownerOf(db: Database.Database, accountId: number): number {
  return (db.prepare("SELECT owner_id FROM accounts WHERE id = ?").get(accountId) as { owner_id: number }).owner_id;
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

test("createAccount: titular novo cria corrente e persiste em centavos", () => {
  const { service, db } = setup([]);
  const acc = service.createAccount("checking", 100.5, { name: "Ana" });
  assert.equal(acc.owner.name, "Ana");
  assert.equal(acc.type, "checking");
  assert.equal(acc.balance, 100.5);
  assert.equal(balanceOf(db, acc.id), toCents(100.5)); // 10050
  assert.equal(countTitulares(db), 1);
});

test("createAccount: saldo inicial 0 cria poupança zerada", () => {
  const { service } = setup([]);
  const acc = service.createAccount("savings", 0, { name: "Bia" });
  assert.equal(acc.type, "savings");
  assert.equal(acc.balance, 0);
});

test("createAccount: saldo inicial negativo é rejeitado (regra de negócio)", () => {
  const { service } = setup([]);
  assert.equal(
    codeOfThrow(() => service.createAccount("checking", -0.01, { name: "Caio" })),
    "NEGATIVE_INITIAL_BALANCE",
  );
});

test("createAccount: saldo com 2 casas não sofre drift de float", () => {
  const { service, db } = setup([]);
  const acc = service.createAccount("savings", 99.99, { name: "Dora" });
  assert.equal(acc.balance, 99.99);
  assert.equal(balanceOf(db, acc.id), 9999);
});

test("createAccount: titular existente vincula a conta ao mesmo dono (sem criar outro)", () => {
  const { service, db, ids } = setup([{ name: "João", type: "checking", balance: 1000 }]);
  const ownerId = ownerOf(db, ids[0]);
  const poupanca = service.createAccount("savings", 0, { id: ownerId });
  assert.equal(poupanca.owner.id, ownerId);
  assert.equal(poupanca.owner.name, "João");
  assert.equal(countTitulares(db), 1); // reusou o titular, não criou um novo
});

test("createAccount: owner_id inexistente é rejeitado", () => {
  const { service } = setup([]);
  assert.equal(codeOfThrow(() => service.createAccount("checking", 0, { id: 999 })), "OWNER_NOT_FOUND");
});

test("createAccount: saldo negativo não cria titular órfão (atômico)", () => {
  const { service, db } = setup([]);
  assert.equal(codeOfThrow(() => service.createAccount("checking", -5, { name: "Novo" })), "NEGATIVE_INITIAL_BALANCE");
  assert.equal(countTitulares(db), 0);
});
