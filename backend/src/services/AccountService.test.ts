import { describe, it, expect } from "vitest";
import type Database from "better-sqlite3";
import { AppError } from "../errors";
import { toCents } from "../money";
import { AccountService } from "./AccountService";
import { makeTestDb, type AccountSeed } from "../test/fixtures";

/** Service sobre um banco em memória isolado com as contas dadas como fixtures. */
function setup(accounts: AccountSeed[] = []) {
  const { db, ids } = makeTestDb(accounts);
  return { service: new AccountService(db), db, ids };
}

function balanceOf(db: Database.Database, id: number): number {
  return (db.prepare("SELECT balance FROM accounts WHERE id = ?").get(id) as { balance: number }).balance;
}

function countTitulares(db: Database.Database): number {
  return (db.prepare("SELECT COUNT(*) AS c FROM titulares").get() as { c: number }).c;
}

function ownerOf(db: Database.Database, accountId: number): number {
  return (db.prepare("SELECT owner_id FROM accounts WHERE id = ?").get(accountId) as { owner_id: number }).owner_id;
}

/** Executa `fn` esperando um AppError e devolve o seu `code`. */
function codeOfThrow(fn: () => void): string {
  try {
    fn();
  } catch (err) {
    if (err instanceof AppError) return err.code;
    throw err;
  }
  throw new Error("esperava que lançasse, mas não lançou");
}

describe("R1 — conta corrente", () => {
  it("saque cobra tarifa de R$ 1 além do valor", () => {
    const { service, db, ids } = setup([{ name: "A", type: "checking", balance: 1000 }]);
    const res = service.withdraw(ids[0], 100);
    expect(res.balance).toBe(899); // 1000 - 100 - 1
    expect(res.fee_charged).toBe(1);
    expect(balanceOf(db, ids[0])).toBe(toCents(899));
  });

  it("saque pode deixar o saldo negativo dentro do limite", () => {
    const { service, ids } = setup([{ name: "A", type: "checking", balance: 0 }]);
    const res = service.withdraw(ids[0], 100); // 0 - 100 - 1 = -101
    expect(res.balance).toBe(-101);
  });

  it("saldo pode chegar exatamente a -R$ 500 (limite do cheque especial)", () => {
    const { service, ids } = setup([{ name: "A", type: "checking", balance: 0 }]);
    const res = service.withdraw(ids[0], 499); // 0 - 499 - 1 = -500
    expect(res.balance).toBe(-500);
  });

  it("saque que passaria de -R$ 500 (com a tarifa) é negado e não altera saldo", () => {
    const { service, db, ids } = setup([{ name: "A", type: "checking", balance: 0 }]);
    expect(codeOfThrow(() => service.withdraw(ids[0], 499.01))).toBe("INSUFFICIENT_FUNDS");
    expect(balanceOf(db, ids[0])).toBe(0);
  });
});

describe("R2 — conta poupança", () => {
  it("não tem tarifa e pode zerar o saldo", () => {
    const { service, ids } = setup([{ name: "A", type: "savings", balance: 800 }]);
    const res = service.withdraw(ids[0], 800);
    expect(res.balance).toBe(0);
    expect(res.fee_charged).toBe(0);
  });

  it("não pode ficar negativa", () => {
    const { service, db, ids } = setup([{ name: "A", type: "savings", balance: 800 }]);
    expect(codeOfThrow(() => service.withdraw(ids[0], 800.01))).toBe("SAVINGS_NEGATIVE_BALANCE");
    expect(balanceOf(db, ids[0])).toBe(toCents(800));
  });
});

describe("validação e conta inexistente", () => {
  it("saque de valor <= 0 é rejeitado", () => {
    const { service, ids } = setup([{ name: "A", type: "checking", balance: 100 }]);
    expect(codeOfThrow(() => service.withdraw(ids[0], 0))).toBe("INVALID_AMOUNT");
  });

  it("saque em conta inexistente dá 404", () => {
    const { service } = setup([]);
    expect(codeOfThrow(() => service.withdraw(999, 10))).toBe("ACCOUNT_NOT_FOUND");
  });

  it("histórico de conta inexistente dá 404", () => {
    const { service } = setup([]);
    expect(codeOfThrow(() => service.history(999))).toBe("ACCOUNT_NOT_FOUND");
  });
});

describe("transferência", () => {
  it("origem corrente paga tarifa e o destino recebe o valor integral", () => {
    const { service, db, ids } = setup([
      { name: "Origem", type: "checking", balance: 1000 },
      { name: "Destino", type: "savings", balance: 0 },
    ]);
    const res = service.transfer(ids[0], ids[1], 100);
    expect(res.from.balance).toBe(899); // 1000 - 100 - 1
    expect(res.to.balance).toBe(100);
    expect(res.fee_charged).toBe(1);
    expect(balanceOf(db, ids[0])).toBe(toCents(899));
    expect(balanceOf(db, ids[1])).toBe(toCents(100));
  });

  it("origem poupança é isenta de tarifa", () => {
    const { service, ids } = setup([
      { name: "Origem", type: "savings", balance: 100 },
      { name: "Destino", type: "checking", balance: 0 },
    ]);
    const res = service.transfer(ids[0], ids[1], 100);
    expect(res.from.balance).toBe(0);
    expect(res.fee_charged).toBe(0);
  });

  it("origem corrente que estouraria o limite com a tarifa é negada e nada muda", () => {
    const { service, db, ids } = setup([
      { name: "Origem", type: "checking", balance: 0 },
      { name: "Destino", type: "savings", balance: 0 },
    ]);
    expect(codeOfThrow(() => service.transfer(ids[0], ids[1], 500))).toBe("INSUFFICIENT_FUNDS"); // 0-500-1
    expect(balanceOf(db, ids[0])).toBe(0);
    expect(balanceOf(db, ids[1])).toBe(0);
  });

  it("destino inexistente dá 404 e não altera a origem", () => {
    const { service, db, ids } = setup([{ name: "Origem", type: "checking", balance: 1000 }]);
    expect(codeOfThrow(() => service.transfer(ids[0], 999, 100))).toBe("ACCOUNT_NOT_FOUND");
    expect(balanceOf(db, ids[0])).toBe(toCents(1000));
  });

  it("inválida é atômica: nenhum saldo muda", () => {
    const { service, db, ids } = setup([
      { name: "Origem", type: "savings", balance: 50 },
      { name: "Destino", type: "checking", balance: 0 },
    ]);
    expect(codeOfThrow(() => service.transfer(ids[0], ids[1], 51))).toBe("SAVINGS_NEGATIVE_BALANCE");
    expect(balanceOf(db, ids[0])).toBe(toCents(50));
    expect(balanceOf(db, ids[1])).toBe(0);
  });

  it("para a mesma conta é rejeitada", () => {
    const { service, ids } = setup([{ name: "A", type: "checking", balance: 100 }]);
    expect(codeOfThrow(() => service.transfer(ids[0], ids[0], 10))).toBe("SAME_ACCOUNT");
  });
});

describe("aritmética em centavos (sem drift de float)", () => {
  it("0.30 − 0.10 − 0.20 = 0 exato", () => {
    const { service, db, ids } = setup([{ name: "A", type: "savings", balance: 0.3 }]);
    service.withdraw(ids[0], 0.1);
    const res = service.withdraw(ids[0], 0.2);
    expect(res.balance).toBe(0);
    expect(balanceOf(db, ids[0])).toBe(0);
  });

  it("99.99 é persistido como 9999 centavos", () => {
    const { service, db } = setup([]);
    const acc = service.createAccount("savings", 99.99, { name: "Dora" });
    expect(acc.balance).toBe(99.99);
    expect(balanceOf(db, acc.id)).toBe(9999);
  });
});

describe("criação de conta", () => {
  it("titular novo cria corrente e persiste em centavos", () => {
    const { service, db } = setup([]);
    const acc = service.createAccount("checking", 100.5, { name: "Ana" });
    expect(acc.owner.name).toBe("Ana");
    expect(acc.type).toBe("checking");
    expect(acc.balance).toBe(100.5);
    expect(balanceOf(db, acc.id)).toBe(toCents(100.5));
    expect(countTitulares(db)).toBe(1);
  });

  it("saldo inicial 0 cria poupança zerada", () => {
    const { service } = setup([]);
    const acc = service.createAccount("savings", 0, { name: "Bia" });
    expect(acc.type).toBe("savings");
    expect(acc.balance).toBe(0);
  });

  it("saldo inicial negativo é rejeitado (regra de negócio)", () => {
    const { service } = setup([]);
    expect(codeOfThrow(() => service.createAccount("checking", -0.01, { name: "Caio" }))).toBe(
      "NEGATIVE_INITIAL_BALANCE",
    );
  });

  it("titular existente vincula a conta ao mesmo dono (sem criar outro)", () => {
    const { service, db, ids } = setup([{ name: "João", type: "checking", balance: 1000 }]);
    const ownerId = ownerOf(db, ids[0]);
    const poupanca = service.createAccount("savings", 0, { id: ownerId });
    expect(poupanca.owner.id).toBe(ownerId);
    expect(poupanca.owner.name).toBe("João");
    expect(countTitulares(db)).toBe(1);
  });

  it("owner_id inexistente é rejeitado", () => {
    const { service } = setup([]);
    expect(codeOfThrow(() => service.createAccount("checking", 0, { id: 999 }))).toBe("OWNER_NOT_FOUND");
  });

  it("saldo negativo não cria titular órfão (atômico)", () => {
    const { service, db } = setup([]);
    expect(codeOfThrow(() => service.createAccount("checking", -5, { name: "Novo" }))).toBe(
      "NEGATIVE_INITIAL_BALANCE",
    );
    expect(countTitulares(db)).toBe(0);
  });
});
