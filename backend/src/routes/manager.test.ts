import { describe, it, expect } from "vitest";
import request from "supertest";
import { createApp } from "../app";
import { makeTestDb, type AccountSeed } from "../test/fixtures";

/** App Express sobre um :memory: isolado, com as contas dadas como fixtures. */
function makeApp(accounts: AccountSeed[] = []) {
  const { db, ids } = makeTestDb(accounts);
  return { app: createApp(db), ids };
}

describe("GET /manager", () => {
  it("200 com o saldo acumulado de tarifas da carteira do gerente", async () => {
    const { app, ids } = makeApp([
      { name: "Cliente", type: "checking", balance: 1000 },
      { name: "Gerente", type: "manager", balance: 0 },
    ]);
    // Um saque de corrente credita R$ 1,00 de tarifa no gerente.
    await request(app).post(`/api/v1/accounts/${ids[0]}/withdraw`).send({ amount: 100 });
    const res = await request(app).get("/api/v1/manager");
    expect(res.status).toBe(200);
    expect(res.body.type).toBe("manager");
    expect(res.body.balance).toBe(1);
  });

  it("404 MANAGER_NOT_FOUND quando não há conta de gerente", async () => {
    const { app } = makeApp([{ name: "Cliente", type: "checking", balance: 1000 }]);
    const res = await request(app).get("/api/v1/manager");
    expect(res.status).toBe(404);
    expect(res.body.code).toBe("MANAGER_NOT_FOUND");
  });
});

describe("GET /manager/history", () => {
  it("200 lista as tarifas creditadas (transfer_in de R$ 1)", async () => {
    const { app, ids } = makeApp([
      { name: "Cliente", type: "checking", balance: 1000 },
      { name: "Gerente", type: "manager", balance: 0 },
    ]);
    await request(app).post(`/api/v1/accounts/${ids[0]}/withdraw`).send({ amount: 100 });
    await request(app).post(`/api/v1/accounts/${ids[0]}/withdraw`).send({ amount: 100 });
    const res = await request(app).get("/api/v1/manager/history");
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(2);
    expect(res.body[0].type).toBe("transfer_in");
    expect(res.body[0].amount).toBe(1);
  });
});
