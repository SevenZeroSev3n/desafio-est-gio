# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

Technical-interview challenge ("Desafio Técnico — Banco", Agilize internship). The full spec is `ESPECIFICACAO.pdf`. The task is to build a fullstack **Banco** app: an HTTP API backend plus a web frontend that consumes it. As of now the repo contains **only the spec, README, and submission template — no implementation yet.** The first real work is choosing a stack and scaffolding both halves.

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

Amounts are BRL with cents. Use integer cents or a decimal type, not binary floats, to avoid rounding errors in fee/limit checks.

## Build/run commands

None yet — no stack chosen. Once the backend and frontend are scaffolded, document their real start commands here and mirror them into `README.md` (`SUBMISSION.md` is the template for what the README must contain).
