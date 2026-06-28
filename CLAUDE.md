# CLAUDE.md — Reforma Quest Madrid

Guidance for Claude Code (and humans) working in this repository.

## Project description

A low-cost, high-rigor **educational web game**. The player is an inexperienced homeowner renovating a flat in Madrid and learns to understand, contract, supervise, and audit a renovation — and to execute only simple, low-risk DIY when safe. Format: isometric-lite, level-based web adventure.

## Goals

- Teach practical renovation literacy: scope, comparing quotes, hiring, supervising, auditing, spotting red flags, knowing when a professional is mandatory.
- Be fun enough to finish; rigorous and safe above all.
- Stay cheap (static, no backend) and commercial-ready without overengineering.

## Non-goals (MVP)

Accounts, payments, multiplayer, contractor marketplace/recommendations, real-time AI, 3D, procedural generation, backend/database, real legal advice, building calculations, price engines, and **any high-risk execution instructions**.

## Stack

TypeScript · Vite · Phaser (render) + HTML/CSS overlay (interactive UI) · Zod (content validation) · JSON content · LocalStorage · Vitest (unit + golden) · Playwright (e2e) · ESLint · Prettier · GitHub Actions · npm. See `docs/adr/0002-stack-choice.md`.

## Commands

```bash
npm run dev            # local dev server (Vite)
npm run build          # production static build
npm run preview        # preview the build
npm run typecheck      # tsc --noEmit
npm run lint           # eslint
npm run format         # prettier --write
npm run format:check   # prettier --check
npm run test           # vitest unit + golden
npm run test:golden    # golden snapshots only
npm run test:e2e       # Playwright (needs: npx playwright install)
npm run content:lint   # content schema + safety gate
npm audit --audit-level=high
bash scripts/check-secrets.sh
```

## Architecture

- `src/domain/` — **pure, engine-agnostic** logic: `types.ts`, `schema.ts` (Zod), `scoring.ts`, `progress.ts` (injectable storage), `stage-gate.ts`, and `content-safety.ts` (the **single source of truth** for the forbidden-DIY patterns and risk-floor rules, shared by `scripts/content-lint.ts` and the tests). This is what unit/golden tests target.
- `src/content/` — data: `levels/level-*.json`, `sources/source-register.json`. Content is separate from engine.
- `src/game/` — `systems/` (content loader, `GameController`, UI↔scene bridge), `scenes/` (Phaser placeholders), `ui/` (DOM overlay = the interactive loop).
- `src/app/` — `main.ts` bootstrap + `styles.css`.
- `scripts/` — `content-lint.ts`, `check-secrets.sh`. `e2e/` — Playwright specs.

## Content safety rules

No unsafe DIY, no legal/price claims without sources, no advice to avoid licences or hide work. Full red lines: `docs/safety-policy.md`. Enforced by `npm run content:lint` and the `safety-reviewer` subagent. Every technical item is `draft`/`pending_expert_review` until a human expert validates it; high/critical items need a `safetyNotice`.

## Expert review workflow

See `docs/expert-review-workflow.md`. AI subagents assist but can never grant `expert_verified`.

## Testing requirements

The gate must pass before merging: `lint`, `format:check`, `typecheck`, `test`, `content:lint`, `build`. Details + e2e/audit in `docs/test-plan.md`. Do not weaken tests or gates for speed.

## Dependency policy

Before adding a dependency, state: name, purpose, why the current stack is insufficient, maintenance signal, bundle/security risk, and removal strategy. Avoid abandoned packages, heavy UI libs, unnecessary state managers, analytics/AI SDKs, and CMS systems. Current notable cost: **Phaser** (~344 kB gzipped) — justified as the chosen engine; revisit with code-splitting if needed.

## MCP policy

No MCP server is configured automatically. Add later **only with explicit user approval**; never send secrets/private data; never use for legal/construction truth. Log every use in `docs/mcp-usage-log.md`.

## Higgsfield policy

Auxiliary only, after explicit approval, via the `higgsfield-spike-review` skill. Never a source of truth. See `docs/adr/0005-...` and `docs/higgsfield-spike-plan.md`.

## Git conventions

- Don't commit/push unless the user asks. If on the default branch, branch first.
- Small, focused commits with clear messages; keep `main` green (the gate passes).
- Never commit secrets or a real `.env` (`.env.example` only). Never rewrite history without confirmation.

## Do not touch without permission

- User-level Claude settings (`~/.claude/**`).
- Activating hooks or connecting MCP/Higgsfield (draft examples only; ask before enabling).
- Promoting any content to `expert_verified`/`source_verified`.
- Adding a backend, accounts, payments, or analytics.
- Destructive git/filesystem operations.

## Definition of done (Milestone 1)

See `docs/mvp-scope.md`. Met when the repo is initialized with docs/ADRs/policies, Level 1 is playable end-to-end, content schema + lint exist, unit tests and build pass, no secrets, no high-risk content verified, Higgsfield documented as auxiliary, and CI exists.
