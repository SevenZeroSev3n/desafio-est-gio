# Minha Solução — Banco

## Stack
- **Backend:** TypeScript / Node.js 18+ (Express) — com SQLite (`better-sqlite3`) e validação Zod.
- **Frontend:** React + Vite + TypeScript, estilizado com Tailwind CSS.

## Pré-requisitos / dependências
- Node.js 18+ e npm 9+.
- Instalar dependências em cada pasta: `npm install` em `backend/` e em `frontend/`.

## Como executar

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
npm run dev          # http://localhost:5173 (proxy /api -> backend)
```

## Exemplo de uso
1. Abra http://localhost:5173 — três contas de exemplo já aparecem com saldo.
2. Clique em **Sacar** numa conta corrente (ex.: João Silva). Ao sacar R$ 100, a API debita
   R$ 100 + R$ 1,00 de tarifa e retorna o novo saldo; a tela atualiza.
3. Tente sacar além do limite de uma poupança ou estourar o cheque especial (-R$ 500) de uma
   corrente: a API responde 422 e a UI mostra a mensagem de erro de negócio.
4. Use o painel **Transferência** para mover valor entre contas e **Histórico** para ver as transações.

## Observações
- Operação obrigatória (**saque**) e o diferencial (**transferência**) implementados.
- Regra de negócio isolada em `AccountService` (classe pura, sem Express) — rotas só validam e formatam.
- Dinheiro em **centavos inteiros** internamente; transferência é **atômica** (transação SQLite).
- Erros de negócio padronizados em HTTP 422 com `code` estável (`INSUFFICIENT_FUNDS`, `SAVINGS_NEGATIVE_BALANCE`, ...).
