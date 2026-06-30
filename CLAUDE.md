# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

Take-home challenge ("Desafio Técnico — Banco"): a fullstack **Banco** app — HTTP API backend + web frontend that consumes it. Authoritative spec is `ESPECIFICACAO.pdf`; don't restate it here.

**Stack (decided):** backend `backend/` = TypeScript + Express + SQLite (`better-sqlite3`) + Zod. Frontend `frontend/` = React + Vite + TypeScript + Tailwind. Two independent `package.json` (no monorepo tooling). Vite proxies `/api` → backend on port 3001.

**Where the facts live** (point here, don't duplicate):
- Domain language & model (Titular → N Contas, Tipo, Saque, Transferência) → `CONTEXT.md`.
- Account-type rules (fee/overdraft), canonically → `CONTEXT.md §Tipo de conta` + `ESPECIFICACAO.pdf`.
- Run/setup steps → `README.md`. Design decisions → `docs/adr/`.

## Tripwires (don't break these with an edit)

These are graded/eliminatory. Each reads "if you touch X, keep Y true":

- **All business logic stays in the backend.** The frontend only displays results — never compute fees, limits, or balances client-side. Logic leaking into React is an automatic fail.
- **The README must run on a clean machine.** Changing ports, scripts, deps, or seed behavior means updating `README.md` in the same change. Graders run it verbatim; broken steps = elimination.
- **The account-type rules are tested directly — don't weaken them.** When editing `AccountService`, preserve: Corrente charges R$ 1,00/op and may overdraft to −R$ 500,00; Poupança is free and never goes negative. (Exact rules: `CONTEXT.md §Tipo de conta`.)
- **Model account-type behavior once.** No-duplication is graded: don't scatter `if corrente / if poupança` branches — keep the split in one place (currently `computeDebit()`), so a new operation doesn't re-fork the logic.
- **Commit incrementally.** Coherent, incremental history is graded; avoid one giant final commit.

## Money handling

Amounts are BRL. **Money is stored and computed as integer cents** (DB columns are INTEGER cents; `money.ts` converts at the API boundary via `toCents`/`toReais`) — never binary floats, to avoid rounding errors in fee/limit checks.

## Where things live

- `backend/src/services/AccountService.ts` — all business logic (withdraw, transfer). Pure class, no Express. The shared `computeDebit()` helper is the single place the account-type split lives — both withdraw and the transfer source go through it. Rule constants (`CHECKING_FEE_CENTS`, `CHECKING_OVERDRAFT_LIMIT_CENTS`) at the top; the rules themselves are in `CONTEXT.md`.
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
