# Minha Solução — Banco

## Stack
- **Backend:** TypeScript / Node.js 18+ (Express) — com SQLite (`better-sqlite3`) e validação Zod.
- **Frontend:** React + Vite + TypeScript, estilizado com Tailwind CSS.

## Pré-requisitos / dependências
- Node.js 18+ e npm 9+.
- Instalar dependências em cada pasta: `npm install` em `backend/` e em `frontend/`.

## Como executar

> Passo a passo completo (clone + dois terminais) e a referência da API estão no [`README.md`](./README.md).

### Backend (API)
```bash
cd backend
npm install
npm run dev          # API em http://localhost:3001 (cria e popula bank.db no 1º run)
```

### Frontend
```bash
cd frontend
npm install
npm run dev          # http://localhost:5173 (proxy /api -> backend; suba o backend primeiro)
```

## Exemplo de uso
1. Abra http://localhost:5173 — no menu lateral escolha o cliente em **Visualizando** (Titular) e
   navegue pelas telas **Início / Contas / Histórico**. No **Início**, selecione a conta ativa
   (João Silva tem corrente **e** poupança).
2. No painel **Saque**, saque R$ 100 de uma corrente: a API debita R$ 100 + R$ 1,00 de tarifa
   e a tela atualiza.
3. Tente estourar o limite (zerar abaixo de 0 numa poupança, ou passar de -R$ 500 numa corrente):
   a API responde **422** e a UI mostra a mensagem de erro de negócio.
4. Use **Transferência** (origem = conta ativa) e veja o **Histórico** da conta ativa.
5. Em **+ Nova conta**, crie uma conta para um titular existente ou novo.
6. Abra a aba **Carteira do gerente**: ela mostra o total de tarifas acumuladas (R$ 1,00 por
   operação de corrente) e o extrato dessas tarifas.

## Como rodar os testes
```bash
cd backend && npm test     # AccountService (R1/R2) + rotas (supertest), SQLite :memory:
cd frontend && npm test    # smoke da UI (React Testing Library)
```
CI (GitHub Actions) roda as duas suítes em cada PR para `main`, na matriz Node 18 e 20.

## Observações
- Operação obrigatória (**saque**) e o diferencial (**transferência**) implementados.
- Extra: **carteira do gerente** — as tarifas das correntes são creditadas numa conta interna
  (tipo `manager`, escondida do cliente) na mesma transação do débito; exposta por `GET /manager`
  e `/manager/history` e por uma aba na UI.
- Modelo de domínio: **Titular** dono de N **Contas** (nome só no titular — fonte única da verdade).
- Regra de negócio isolada em `AccountService` (classe pura, sem Express); o comportamento por tipo
  de conta vive em `AccountPolicy` (sem `if corrente/poupança` espalhado). Rotas só validam e formatam.
- Dinheiro em **centavos inteiros** internamente; transferência é **atômica** (transação SQLite).
- Erros: shape inválido → **400** (`VALIDATION_ERROR`); regra de negócio → **422** com `code` estável
  (`INSUFFICIENT_FUNDS`, `SAVINGS_NEGATIVE_BALANCE`, `NEGATIVE_INITIAL_BALANCE`, ...).
