import { describe, it, expect } from "vitest";
import request from "supertest";
import { createApp } from "../app";
import { makeTestDb, type AccountSeed } from "../test/fixtures";

/** App Express sobre um :memory: isolado, com as contas dadas como fixtures. */
function makeApp(accounts: AccountSeed[] = []) {
  const { db, ids } = makeTestDb(accounts);
  return { app: createApp(db), ids };
}

describe("POST /accounts/:id/withdraw", () => {
  it("200 no saque válido", async () => {
    const { app, ids } = makeApp([{ name: "A", type: "checking", balance: 1000 }]);
    const res = await request(app).post(`/api/v1/accounts/${ids[0]}/withdraw`).send({ amount: 100 });
    expect(res.status).toBe(200);
    expect(res.body.balance).toBe(899);
    expect(res.body.fee_charged).toBe(1);
  });

  it("422 quando viola a regra de saldo", async () => {
    const { app, ids } = makeApp([{ name: "A", type: "checking", balance: 0 }]);
    const res = await request(app).post(`/api/v1/accounts/${ids[0]}/withdraw`).send({ amount: 1000 });
    expect(res.status).toBe(422);
    expect(res.body.code).toBe("INSUFFICIENT_FUNDS");
  });

  it("400 com body inválido", async () => {
    const { app, ids } = makeApp([{ name: "A", type: "checking", balance: 100 }]);
    const res = await request(app).post(`/api/v1/accounts/${ids[0]}/withdraw`).send({ amount: -5 });
    expect(res.status).toBe(400);
    expect(res.body.code).toBe("VALIDATION_ERROR");
  });
});

describe("POST /accounts/transfer", () => {
  it("200 na transferência válida", async () => {
    const { app, ids } = makeApp([
      { name: "Origem", type: "checking", balance: 1000 },
      { name: "Destino", type: "savings", balance: 0 },
    ]);
    const res = await request(app)
      .post("/api/v1/accounts/transfer")
      .send({ from_id: ids[0], to_id: ids[1], amount: 100 });
    expect(res.status).toBe(200);
    expect(res.body.from.balance).toBe(899);
    expect(res.body.to.balance).toBe(100);
  });

  it("422 quando viola a regra (mesma conta)", async () => {
    const { app, ids } = makeApp([{ name: "A", type: "checking", balance: 100 }]);
    const res = await request(app)
      .post("/api/v1/accounts/transfer")
      .send({ from_id: ids[0], to_id: ids[0], amount: 10 });
    expect(res.status).toBe(422);
    expect(res.body.code).toBe("SAME_ACCOUNT");
  });

  it("400 com body inválido", async () => {
    const { app } = makeApp();
    const res = await request(app).post("/api/v1/accounts/transfer").send({ from_id: 1 });
    expect(res.status).toBe(400);
  });
});

describe("POST /accounts", () => {
  it("201 cria conta para titular novo", async () => {
    const { app } = makeApp();
    const res = await request(app).post("/api/v1/accounts").send({ type: "checking", owner_name: "Ana" });
    expect(res.status).toBe(201);
    expect(res.body.owner.name).toBe("Ana");
    expect(res.body.balance).toBe(0);
  });

  it("400 com shape inválido (tipo)", async () => {
    const { app } = makeApp();
    const res = await request(app).post("/api/v1/accounts").send({ type: "premium", owner_name: "X" });
    expect(res.status).toBe(400);
  });

  it("422 com saldo inicial negativo", async () => {
    const { app } = makeApp();
    const res = await request(app)
      .post("/api/v1/accounts")
      .send({ type: "checking", balance: -5, owner_name: "X" });
    expect(res.status).toBe(422);
    expect(res.body.code).toBe("NEGATIVE_INITIAL_BALANCE");
  });

  it("422 com owner_id inexistente", async () => {
    const { app } = makeApp();
    const res = await request(app).post("/api/v1/accounts").send({ type: "checking", owner_id: 999 });
    expect(res.status).toBe(422);
    expect(res.body.code).toBe("OWNER_NOT_FOUND");
  });

  it("400 quando owner é ambíguo (id e name)", async () => {
    const { app } = makeApp();
    const res = await request(app)
      .post("/api/v1/accounts")
      .send({ type: "checking", owner_id: 1, owner_name: "X" });
    expect(res.status).toBe(400);
  });

  it("400 quando owner está ausente", async () => {
    const { app } = makeApp();
    const res = await request(app).post("/api/v1/accounts").send({ type: "checking" });
    expect(res.status).toBe(400);
  });

  it("400 com nome vazio e com nome > 100 chars", async () => {
    const { app } = makeApp();
    const vazio = await request(app).post("/api/v1/accounts").send({ type: "checking", owner_name: "   " });
    expect(vazio.status).toBe(400);
    const longo = await request(app)
      .post("/api/v1/accounts")
      .send({ type: "checking", owner_name: "a".repeat(101) });
    expect(longo.status).toBe(400);
  });

  it("201 com emoji no nome", async () => {
    const { app } = makeApp();
    const res = await request(app).post("/api/v1/accounts").send({ type: "savings", owner_name: "Zoe 🦊" });
    expect(res.status).toBe(201);
    expect(res.body.owner.name).toBe("Zoe 🦊");
  });
});

describe("conta do gerente é invisível para o cliente", () => {
  it("404 ao sacar da conta do gerente (indistinguível de inexistente)", async () => {
    const { app, ids } = makeApp([{ name: "Gerente", type: "manager", balance: 5000 }]);
    const res = await request(app).post(`/api/v1/accounts/${ids[0]}/withdraw`).send({ amount: 100 });
    expect(res.status).toBe(404);
    expect(res.body.code).toBe("ACCOUNT_NOT_FOUND");
  });

  it("404 ao transferir para a conta do gerente", async () => {
    const { app, ids } = makeApp([
      { name: "Cliente", type: "checking", balance: 1000 },
      { name: "Gerente", type: "manager", balance: 0 },
    ]);
    const res = await request(app)
      .post("/api/v1/accounts/transfer")
      .send({ from_id: ids[0], to_id: ids[1], amount: 100 });
    expect(res.status).toBe(404);
    expect(res.body.code).toBe("ACCOUNT_NOT_FOUND");
  });
});

describe("GET /accounts/:id e /titulares", () => {
  it("404 para conta inexistente", async () => {
    const { app } = makeApp();
    const res = await request(app).get("/api/v1/accounts/999");
    expect(res.status).toBe(404);
    expect(res.body.code).toBe("ACCOUNT_NOT_FOUND");
  });

  it("400 para id não-numérico", async () => {
    const { app } = makeApp();
    const res = await request(app).get("/api/v1/accounts/abc");
    expect(res.status).toBe(400);
  });

  it("200 lista os titulares", async () => {
    const { app } = makeApp([{ name: "João", type: "checking", balance: 100 }]);
    const res = await request(app).get("/api/v1/titulares");
    expect(res.status).toBe(200);
    expect(res.body).toEqual([{ id: 1, nome: "João" }]);
  });
});
