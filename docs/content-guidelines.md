# Content guidelines

How to author content for Reforma Quest Madrid so it is consistent, safe, and reviewable.

## Where content lives

- Levels: `src/content/levels/level-N.json` (one self-contained `LevelPack` per file).
- Sources: `src/content/sources/source-register.json`.
- Schema (source of truth): `src/domain/schema.ts` (mirrors `src/domain/types.ts`).

## Authoring a decision item

Each `ContentItem` needs:

- `id`, `levelId`, `title`, `category`, `riskLevel`, `learningObjective`, `scenarioText`.
- `playerChoices` (≥2): each with `id`, `label`, `consequence`, `scoreDelta`. Optionally `lesson`, `betterQuestion`, `redFlag`, `unlocks` (card ids), `sourceIds`, `recommended`.
- `redFlags`, `legitimateWorkarounds`, `acceptanceChecks` (≥1).
- `sourceIds` (≥1, must exist in the register).
- `status` (`draft`/`pending_expert_review` for MVP) and `expertReview`.
- `safetyNotice` is **required** when `riskLevel` is `high`/`critical`.

## Scoring guidance (the six dimensions)

`safety, quality, budget, time, knowledge, trust`. Keep deltas small (roughly −3…+3). "Cheap" must not always win: cheap-but-unsafe should lose safety/quality; expensive-but-vague should lose budget/trust. Strong answers ask for evidence, staging, photos, measurements, tests, written scope, or professional certification. Mark exactly one strong option `recommended: true` (used for feedback emphasis and golden tests).

## Writing style

- Spanish, player-facing; professional, practical, slightly playful; adult tone.
- Short scenes, concrete contractor claims, visible consequences. No walls of text, no legal dumping.
- Do **not** state legal, normative, construction, or price facts as truth. If a real claim is needed, add a real source to the register first; until then keep it as draft framing.
- Avoid concrete euro figures unless clearly in-fiction (the linter warns on bare euro amounts).

## Cards (learning tips)

Concise "expert tip" cards unlocked by recommended choices. Each needs `sourceIds` (≥1) and a `status`. Never `expert_verified` in the MVP.

## Adding a new available level

1. Author items + cards in `level-N.json`, all `draft`.
2. Set `available: true` only when the slice is playable end-to-end.
3. Add/adjust golden snapshots and the e2e flow.
4. Run the `content-quality-gate` skill, then the full gate.

## Before publishing

Run `npm run content:lint` and the `domain-content-reviewer` + `safety-reviewer` subagents. See `docs/expert-review-workflow.md`.
