# ADR 0004 — No backend for the MVP

- Status: Accepted
- Date: 2026-06-28

## Context

Cost must stay near zero and the architecture must remain commercial-ready without premature infrastructure.

## Decision

Ship the MVP as a **fully static** site with **no backend, no database, no accounts**. Progress is stored in **LocalStorage** behind a small injectable storage interface (`src/domain/progress.ts`). No analytics, no runtime AI, no paid runtime services.

## Consequences

- Free/cheap static hosting (e.g. GitHub Pages, Netlify); `base: './'` makes the build path-agnostic.
- No personal data is collected, simplifying privacy.
- Progress is per-device/per-browser; cross-device sync is explicitly deferred. If accounts/sync are needed later, the storage interface is the seam to extend — without rewriting gameplay.
- Content remains data-driven so a future CMS/backend is additive, not a rewrite.
