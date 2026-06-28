---
name: mvp-slice-builder
description: Use when implementing the first playable version or adding a new level. Keeps scope to one end-to-end slice with placeholders, then state/decision/scoring/summary, then tests and build, before adding more content.
---

# MVP slice builder

Discipline for building a playable slice without over-scoping.

## Procedure

1. Keep scope to **one** end-to-end level first (Level 1 in the MVP).
2. Use placeholders (coloured rectangles, CSS panels, text labels) — no art investment yet.
3. Implement, in order: state (`GameProgress`), decisions (`applyChoice`), scoring (`scoring.ts`), and the level summary/scorecard.
4. Add unit + golden tests for the new logic; add/adjust the e2e flow.
5. Build (`npm run build`) and run the full gate.
6. **Only then** add more content (new levels become available by flipping `available: true` and authoring items/cards).

## Output

A small, testable implementation plan and a changed-files summary. Prefer several small, green steps over one large change.
