# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

Technical-interview challenge ("Desafio Técnico — Banco", Agilize internship). The full spec is `ESPECIFICACAO.pdf`. A fullstack **Banco** app: an HTTP API backend plus a web frontend that consumes it.

**Implemented stack:** backend = `backend/` TypeScript + Express + SQLite (`better-sqlite3`) + Zod; frontend = `frontend/` React + Vite + TypeScript + Tailwind. Two independent `package.json` (no monorepo tooling). Vite proxies `/api` → backend on port 3001.

## Hard constraints (failing any one = elimination)

- **Backend language must be one of:** JavaScript (Node.js), TypeScript (Node.js), Python, Ruby, PHP, Go. Any other language disqualifies the submission.
- **Must deliver both parts:** a backend (API, where ALL business logic lives) and a frontend (web UI that calls the API). One without the other is an automatic fail.
- **Must run exactly as written in `README.md`.** The README must give the backend language+version, prerequisites, and the exact step-by-step to start backend and frontend and use them together. Graders run it on a clean machine; if the steps don't work, it's eliminated. Treat the README run-instructions as a deliverable, not an afterthought.
- Business rules R1/R2 below are tested directly — they must be implemented exactly.

## Business rules (the heart of the challenge)

Two account types behave differently under the same operations:

| | Conta Corrente | Conta Poupança |
|---|---|---|
| Fee per withdrawal/transfer | R$ 1,00 per operation | none |
| Negative balance (overdraft) | allowed down to −R$ 500,00 | not allowed |

- **R1 — Conta Corrente:** every withdrawal/transfer charges an extra R$ 1,00 fee on top of the amount. Balance may go negative, but `amount + fee` must not push the balance below the −R$ 500,00 overdraft limit.
- **R2 — Conta Poupança:** withdrawals/transfers may never make the balance negative, and charge no fee.

Operations:
- **Saque (withdraw) — required.**
- **Transferência (transfer) — optional**, scores bonus points. A transfer applies the source account's withdrawal rules (incl. the R$ 1,00 fee for Corrente) to the source side.

Keep all this logic in the backend; the frontend only displays results.

## Graded on

Functionality (both halves run, communicate, obey the rules), code quality (clarity, separation of concerns, no duplication — so model the account-type behavior to avoid branching the same `if corrente / if poupança` logic everywhere), and process (coherent commit history — commit incrementally, not one giant final commit).

## Money handling

Amounts are BRL. **Money is stored and computed as integer cents** (DB columns are INTEGER cents; `money.ts` converts at the API boundary via `toCents`/`toReais`) — never binary floats, to avoid rounding errors in fee/limit checks.

## Where things live

- `backend/src/services/AccountService.ts` — all business logic (withdraw, transfer). Pure class, no Express. The shared `computeDebit()` helper applies R1/R2 once for both withdraw and the transfer source (avoids duplicating the `if checking / if savings` logic). Rule constants (`CHECKING_FEE_CENTS`, `CHECKING_OVERDRAFT_LIMIT_CENTS`) live at the top.
- `backend/src/routes/accounts.ts` — HTTP routes; only validate (Zod) + call service + format. Note `/transfer` is registered before `/:id` to avoid route collision.
- `backend/src/db/{database,seed}.ts` — schema created idempotently on import; `seedIfEmpty()` (called from `server.ts`) inserts 3 sample accounts. `bank.db` is git-ignored and auto-created.
- Business errors throw `AppError` (code + HTTP status); the central handler in `app.ts` maps `AppError`/`ZodError` to JSON. Business-rule violations → HTTP 422.
- `frontend/src/api/bankApi.ts` — typed HTTP client; throws `ApiRequestError` carrying the backend's message/code.

## Build/run commands

Each part has its own `package.json`; run `npm install` in each.

- Backend (port 3001): `cd backend && npm run dev` (tsx watch). Prod: `npm run build` (tsc → `dist/`) then `npm start`. Typecheck: `npx tsc --noEmit`.
- Frontend (port 5173): `cd frontend && npm run dev` (Vite). `npm run build` typechecks then bundles.
- No test suite yet — verify rules with curl against the running API (see `README.md` examples) or add tests if extending.

Keep `README.md` run steps in sync with these (eliminatory criterion).
