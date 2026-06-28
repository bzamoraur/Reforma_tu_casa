# Source register

The machine-readable register is `src/content/sources/source-register.json`; it is validated by `npm run content:lint`. This document explains it.

## Purpose

Every technical/normative claim in the game must trace to a source entry. Content references sources by `sourceId`. The linter fails if an item references a `sourceId` that does not exist.

## Entry fields

- `id` — stable unique id (e.g. `src-documentation-practice`).
- `title` — human-readable name.
- `type` — e.g. `practice-note`, `regulatory-awareness`, `standard`, `official`.
- `jurisdiction` — e.g. `Madrid, Spain` or `Spain (general)`.
- `citation` — URL or full citation (or a clearly-marked placeholder).
- `dateAccessed` — ISO date or `PENDING`.
- `summary` — what the source supports.
- `reliability` — `high | medium | low | placeholder`.
- `contentAreas` — categories supported (matches content categories).
- `limitations` — what the source does **not** establish.

## Current state (MVP)

All four entries are **placeholders** (`reliability: "placeholder"`). They anchor topic areas (contracting, documentation, payment staging, Madrid licensing awareness) but assert **no verified facts**. They exist so the schema/integrity checks pass and so reviewers can see exactly where real sources are still needed.

## Rule

A `placeholder` source can never support an `expert_verified`/`source_verified` claim. To verify content:

1. Replace the placeholder with a real, dated citation (official/primary where possible).
2. Set an appropriate `reliability`.
3. Then proceed through `docs/expert-review-workflow.md`.

## Adding a source

Append an entry with a unique `id`, fill all fields, run `npm run content:lint`, then reference it from content via `sourceIds`.
