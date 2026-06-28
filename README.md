# Reforma Quest Madrid

An educational web game where you play an inexperienced homeowner renovating a flat in **Madrid** and learn to **understand, contract, supervise, and audit** a renovation — and to avoid being overcharged or pushed into unsafe shortcuts. Isometric-lite, level-based, browser-first.

> ⚠️ **Disclaimer.** This is an educational game in active development. All renovation content is **draft and pending validation by a human expert**. It is **not** professional, legal, technical, or construction advice. Always consult a qualified professional and the applicable local rules before making renovation decisions.

## Status (MVP)

- ✅ **Level 1 — "Antes de firmar el presupuesto"** playable end-to-end (6 decision scenarios, scoring across 6 dimensions, feedback, learning-card unlocks, red-flag review, audit checklist, scorecard, LocalStorage progress).
- ✅ **Level 2 — "Licencias, comunidad y planificación"** playable end-to-end (6 scenarios on permits/declarations awareness, community of owners, noise & schedules, waste, calendar realism, and when a technician is required). Level select + next-level progression in the menu.
- 🔒 Levels 3–5 are present as locked stubs (content pending expert validation).
- ✅ Content schema + safety linter, unit + golden tests (88 passing), 2 Playwright e2e specs, production build, GitHub Actions CI, clean `npm audit`.
- ⚠️ All renovation content is **draft / pending expert validation**; the licence/community items intentionally stay awareness-only (no specific legal thresholds, fees or deadlines) until real sources and a human expert sign off.

## Run locally

Requires Node ≥ 20.

```bash
npm install
npm run dev      # open the printed URL (default http://localhost:5173)
```

## Build & preview

```bash
npm run build    # static output in dist/
npm run preview
```

## Test & quality gate

```bash
npm run test          # unit + golden tests
npm run content:lint  # content schema + safety checks
npm run lint
npm run typecheck
npm run format:check
npm run build

# End-to-end (one-time browser install required):
npx playwright install
npm run test:e2e
```

## Repository structure

```text
src/
  domain/    pure logic: types, zod schema, scoring, progress, stage-gate
  content/   data: levels/*.json, sources/source-register.json
  game/      systems/ (loader, controller, bridge), scenes/ (Phaser), ui/ (DOM overlay)
  app/       main.ts bootstrap + styles.css
  tests/     unit + golden tests
scripts/     content-lint.ts, check-secrets.sh
e2e/         Playwright specs
docs/        adr/, safety-policy, content-guidelines, expert-review-workflow, test-plan, ...
.claude/     project agents + skills (+ settings.example.json)
.github/     CI workflow
```

## Key docs

- `CLAUDE.md` — working guide, commands, policies.
- `docs/mvp-scope.md`, `docs/safety-policy.md`, `docs/content-guidelines.md`, `docs/expert-review-workflow.md`, `docs/test-plan.md`.
- `docs/adr/` — architecture decisions (scope, stack, content safety, no-backend, Higgsfield).

## Privacy & cost

No accounts, no analytics, no backend. Progress lives in your browser's LocalStorage. The game is a static site designed for free/cheap static hosting.

## License

UNLICENSED / all rights reserved for now (kept commercial-ready). Do not add unlicensed assets; document any generated assets.
