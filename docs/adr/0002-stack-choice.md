# ADR 0002 — Stack choice

- Status: Accepted
- Date: 2026-06-28

## Context

We need a low-cost, static-deploy-friendly web game with strong typing, runtime content validation, and a solid test story.

## Decision

- **TypeScript + Vite** — fast dev/build, static output, first-class TS.
- **Phaser** for the game/render layer; **HTML/CSS overlays** for the interactive UI (keeps the loop accessible and e2e-testable).
- **Zod** for runtime content validation (shared by the game loader and the content linter).
- **JSON** content files versioned in Git; **LocalStorage** for MVP progress (no backend).
- **Vitest** (unit + golden snapshots, jsdom env), **Playwright** (e2e), **ESLint** + **Prettier**, **GitHub Actions** CI, **npm**.

## Consequences

- Phaser adds ~344 kB gzipped to the bundle (single large dependency). Accepted for the MVP; revisit with code-splitting if more engine features land. Recorded in the dependency policy (`CLAUDE.md`).
- The interactive UI lives in the DOM overlay rather than inside Phaser, so unit tests avoid canvas/WebGL and e2e can assert on real elements.
- Vite/Vitest were upgraded to patched majors (vite 8, vitest 4) to keep `npm audit` clean.
