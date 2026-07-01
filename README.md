# Banco — Desafio Técnico Agilize 🏦

Aplicação fullstack de um banco com duas contas (corrente e poupança). O **backend** expõe uma API HTTP com toda a regra de negócio; o **frontend** consome essa API para sacar, transferir e ver o histórico. As tarifas cobradas nas contas corrente são acumuladas numa **carteira interna do gerente**, visível numa aba própria da UI.


## Stack

- **Backend:** TypeScript 5.5 sobre Node.js (Express 4.21) · SQLite via `better-sqlite3` 11 ·
  validação com Zod 3.23.
- **Frontend:** React 18.3 + Vite 5.3 + TypeScript 5.5 · Tailwind CSS 3.4.

## Pré-requisitos

- **Node.js 18 ou 20 (LTS)** e **npm 9+** — baixe em [nodejs.org](https://nodejs.org) (o instalador
  já inclui o npm). Funciona igual em Linux, Windows e macOS, desde que seja uma LTS.
  Desenvolvido e testado em WSL (Ubuntu), Node 18.19.
  Evite Node 22+: `better-sqlite3` (dependência nativa) pode não ter binário pré-compilado para
  versões muito recentes em todas as plataformas, forçando compilação local (exige Python + build
  tools) — prefira uma LTS pra não precisar disso.
- **Git**, para clonar o repositório.

Cada parte tem seu próprio `package.json` — rode `npm install` nas duas pastas (comandos abaixo
são os mesmos em qualquer terminal: Bash/Zsh no Linux/macOS, PowerShell/CMD no Windows).

> **Windows + PowerShell:** se `npm` der o erro "a execução de scripts foi desabilitada neste
> sistema", rode uma vez (não precisa ser administrador) e tente de novo:
> ```powershell
> Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
> ```

## Como executar

### 0. Clonar o repositório

```bash
git clone https://github.com/SevenZeroSev3n/desafio-est-gio.git
cd desafio-est-gio
```

Depois abra **dois terminais** (a partir desta pasta): um para o backend, outro para o frontend.
O frontend consome a API, então **suba o backend primeiro**.

### 1. Backend (API) — porta 3001

```bash
cd backend
npm install
npm run dev
```

A API sobe em `http://localhost:3001`. O banco SQLite (`backend/bank.db`) é criado e populado
automaticamente com titulares e contas de exemplo na primeira execução — nada a configurar.

### 2. Frontend — porta 5173

```bash
cd frontend
npm install
npm run dev
```

Acesse **http://localhost:5173**. O Vite faz proxy de `/api` para o backend, então não há CORS a configurar.

### 3. Usando os dois juntos

Com backend (porta 3001) e frontend (porta 5173) rodando, no navegador:

1. A tela **Início** já abre com o primeiro cliente (João Silva) e sua conta corrente selecionados —
   os dados vêm do seed automático (tabela abaixo).
2. Troque de conta no seletor do topo (Corrente ↔ Poupança) ou de cliente pela barra lateral.
3. Faça um **Saque** ou uma **Transferência** no painel à direita — o saldo, o extrato e (se for
   conta corrente) a tarifa de R$ 1,00 atualizam na hora.
4. Aba **Histórico**: extrato completo da conta ativa, com filtro Entradas/Saídas.
5. Aba **Carteira do gerente**: soma das tarifas de R$ 1,00 cobradas em todas as contas corrente.

Se a tela mostrar "Não foi possível carregar as contas", o backend não está rodando na porta 3001 —
confira o terminal do passo 1.

## Contas de exemplo (criadas no seed)

Cada conta pertence a um **titular**; um titular pode ter mais de uma conta (João tem as duas).

| ID | Titular      | Tipo     | Saldo inicial |
|----|--------------|----------|---------------|
| 1  | João Silva   | Corrente | R$ 1.000,00   |
| 2  | João Silva   | Poupança | R$ 2.000,00   |
| 3  | Maria Souza  | Corrente | R$ 500,00     |
| 4  | Pedro Costa  | Poupança | R$ 800,00     |

Além dessas, o seed cria uma **conta interna do gerente** (titular `Gerente`, tipo `manager`, saldo
inicial R$ 0,00) que acumula as tarifas. Ela é invisível para o cliente — **não** aparece em
`GET /accounts` e é intocável pelas rotas de conta (o id dela responde `404` como se não existisse).

## Regras de negócio

| Regra | Conta Corrente (`checking`)                          | Conta Poupança (`savings`)            |
|-------|------------------------------------------------------|---------------------------------------|
| Tarifa por saque/transferência | R$ 1,00 por operação                      | Isento                                |
| Saldo negativo | Permitido até **-R$ 500,00** (cheque especial); `valor + tarifa` não pode ultrapassar o limite | **Não permitido** |

Na **transferência**, a conta de origem segue as regras do seu próprio tipo (tarifa/limite); o destino
recebe o valor integral. Débito e crédito acontecem numa transação do SQLite.

Cada tarifa de R$ 1,00 cobrada numa corrente é **creditada na carteira do gerente** na mesma transação
do débito — o saldo da carteira é sempre igual à soma das tarifas coletadas. A poupança não gera tarifa
nem lançamento na carteira. Consulte a carteira pelas rotas `/manager` abaixo.

> Os valores são manipulados internamente em **centavos (inteiro)** para evitar erros de ponto flutuante.

## API HTTP

Base: `http://localhost:3001/api/v1`

| Método | Rota                      | Descrição                                  |
|--------|---------------------------|--------------------------------------------|
| GET    | `/titulares`              | Lista os titulares (donos)                  |
| GET    | `/accounts`               | Lista todas as contas (com `owner`)         |
| GET    | `/accounts/:id`           | Detalhe de uma conta                        |
| POST   | `/accounts`               | Cria uma conta para um titular novo (`owner_name`) ou existente (`owner_id`) |
| POST   | `/accounts/:id/withdraw`  | Saque (aplica R1/R2)                         |
| POST   | `/accounts/transfer`      | Transferência entre contas                  |
| GET    | `/accounts/:id/history`   | Histórico de transações da conta            |
| GET    | `/manager`                | Carteira do gerente: saldo acumulado de tarifas |
| GET    | `/manager/history`        | Extrato das tarifas creditadas na carteira  |

### Exemplos

```bash
# Saque
Erros de validação de shape retornam **HTTP 400** (`VALIDATION_ERROR`); erros de regra de negócio
retornam **HTTP 422** com `{ "error", "code", ... }` — ex.: `INSUFFICIENT_FUNDS` (estouro do cheque
especial), `SAVINGS_NEGATIVE_BALANCE` (poupança ficaria negativa) e `NEGATIVE_INITIAL_BALANCE`.
Uma operação de cliente sobre o id da conta do gerente responde **404** (`ACCOUNT_NOT_FOUND`), como
qualquer conta inexistente; `GET /manager` sem carteira criada responde **404** (`MANAGER_NOT_FOUND`).

## Como rodar os testes

Cada parte tem sua suíte ([Vitest](https://vitest.dev); backend usa `supertest` para as rotas,
frontend usa React Testing Library). Rode em cada pasta após o `npm install`:

```bash
# Backend — regras R1/R2 do AccountService + testes de rota (banco SQLite :memory: isolado)
cd backend
npm test

# Frontend — smoke da UI com a API mockada
cd frontend
npm test
```

(Comandos em linhas separadas de propósito — `&&` não funciona no PowerShell 5.1 padrão do Windows.)

Os mesmos comandos rodam no CI (GitHub Actions) em cada Pull Request para `main`, na matriz
Node 18 e 20 — ver `.github/workflows/ci.yml`.

## Estrutura

```
backend/
  src/
    services/AccountService.ts    # regras de negócio (saque, transferência, criação, carteira) — sem Express, sem SQL direto
    services/AccountRepository.ts # acesso ao SQLite (SELECT/INSERT/UPDATE) — sem regra de negócio
    services/accountPolicy.ts     # comportamento por tipo de conta (tarifa/limite); inclui a policy do gerente
    routes/{accounts,titulares,manager}.ts  # rotas HTTP (factories) + validação Zod
    validators/schemas.ts
    db/{database,schema,seed}.ts # schema idempotente + seed automático (inclui a conta do gerente)
    *.test.ts                   # Vitest (AccountService + rotas via supertest)
    money.ts errors.ts types.ts app.ts server.ts
frontend/
  src/
    components/                 # Sidebar, BalanceHero, Sparkline, WithdrawPanel, TransferPanel,
                                # HistoryPanel, ContasScreen, HistoricoScreen, ManagerWallet, NewAccountModal,
                                # TxRow, PixelField
    hooks/                       # useAccountsData, useSelection, useAccountHistory — estado/efeitos que o App.tsx compõe
    api/bankApi.ts              # cliente HTTP tipado
    format.ts lib/history.ts lib/txStyle.ts  # formatação (BRL/datas) e derivação de exibição (sparkline/totais/estilo de linha)
    App.tsx App.test.tsx main.tsx
```

A regra de negócio fica isolada em `AccountService` (classe pura, sem dependência de HTTP nem SQL
direto — persistência é responsabilidade de `AccountRepository`); as rotas só validam a entrada,
chamam o service e formatam a resposta.
