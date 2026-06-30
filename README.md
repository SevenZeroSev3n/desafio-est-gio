# Banco — Desafio Técnico Agilize 🏦

Aplicação fullstack de um banco com duas contas (corrente e poupança). O **backend** expõe uma API HTTP com toda a regra de negócio; o **frontend** consome essa API para sacar, transferir e ver o histórico.

> Especificação original do desafio em [`ESPECIFICACAO.pdf`](./ESPECIFICACAO.pdf).

## Stack

- **Backend:** TypeScript + Node.js (Express) · SQLite via `better-sqlite3` · validação com Zod
- **Frontend:** React + Vite + TypeScript · Tailwind CSS

## Pré-requisitos

- **Node.js 18+** e **npm 9+** (testado em Node 18.19).

Cada parte tem seu próprio `package.json` — rode `npm install` nas duas pastas.

## Como executar

Abra **dois terminais**: um para o backend, outro para o frontend.

### 1. Backend (API) — porta 3001

```bash
cd backend
npm install
npm run dev
```

A API sobe em `http://localhost:3001`. O banco SQLite (`backend/bank.db`) é criado e populado
automaticamente com 3 contas de exemplo na primeira execução — nada a configurar.

### 2. Frontend — porta 5173

```bash
cd frontend
npm install
npm run dev
```

Acesse **http://localhost:5173**. O Vite faz proxy de `/api` para o backend, então não há CORS a configurar.

## Contas de exemplo (criadas no seed)

| ID | Nome         | Tipo     | Saldo inicial |
|----|--------------|----------|---------------|
| 1  | João Silva   | Corrente | R$ 1.000,00   |
| 2  | Maria Souza  | Corrente | R$ 500,00     |
| 3  | Pedro Costa  | Poupança | R$ 800,00     |

## Regras de negócio

| Regra | Conta Corrente (`checking`)                          | Conta Poupança (`savings`)            |
|-------|------------------------------------------------------|---------------------------------------|
| Tarifa por saque/transferência | R$ 1,00 por operação                      | Isento                                |
| Saldo negativo | Permitido até **-R$ 500,00** (cheque especial); `valor + tarifa` não pode ultrapassar o limite | **Não permitido** |

Na **transferência**, a conta de origem segue as regras do seu próprio tipo (tarifa/limite); o destino
recebe o valor integral. Débito e crédito acontecem numa transação atômica do SQLite.

> Os valores são manipulados internamente em **centavos (inteiro)** para evitar erros de ponto flutuante.

## API HTTP

Base: `http://localhost:3001/api/v1`

| Método | Rota                      | Descrição                                  |
|--------|---------------------------|--------------------------------------------|
| GET    | `/accounts`               | Lista todas as contas com saldo            |
| GET    | `/accounts/:id`           | Detalhe de uma conta                        |
| POST   | `/accounts`               | Cria uma conta                              |
| POST   | `/accounts/:id/withdraw`  | Saque (aplica R1/R2)                         |
| POST   | `/accounts/transfer`      | Transferência entre contas                  |
| GET    | `/accounts/:id/history`   | Histórico de transações da conta            |

### Exemplos

```bash
# Saque de R$ 100 na conta 1 (corrente): cobra R$ 1 de tarifa
curl -X POST http://localhost:3001/api/v1/accounts/1/withdraw \
  -H 'Content-Type: application/json' -d '{"amount":100}'

# Transferência de R$ 50 da conta 1 para a 3
curl -X POST http://localhost:3001/api/v1/accounts/transfer \
  -H 'Content-Type: application/json' -d '{"from_id":1,"to_id":3,"amount":50}'
```

Erros de negócio retornam **HTTP 422** com `{ "error", "code", ... }` — ex.: `INSUFFICIENT_FUNDS`
(estouro do cheque especial) e `SAVINGS_NEGATIVE_BALANCE` (poupança ficaria negativa).

## Estrutura

```
backend/
  src/
    services/AccountService.ts  # regras de negócio (saque, transferência) — sem Express
    routes/accounts.ts          # rotas HTTP + validação Zod
    validators/schemas.ts
    db/{database,seed}.ts        # schema + seed automático
    money.ts errors.ts types.ts app.ts server.ts
frontend/
  src/
    components/                 # AccountCard, WithdrawModal, TransferPanel, HistoryPanel
    api/bankApi.ts              # cliente HTTP tipado
    App.tsx main.tsx
```

Toda a regra de negócio fica isolada em `AccountService` (classe pura, sem dependência de HTTP);
as rotas só validam a entrada, chamam o service e formatam a resposta.
