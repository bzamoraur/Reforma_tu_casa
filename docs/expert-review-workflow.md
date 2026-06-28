# Expert review workflow

All technical renovation content must be validated by a qualified human expert (e.g. an architect, technical architect/aparejador, or experienced site manager) before it can be presented as verified.

## States

Content `status`: `draft` → `pending_expert_review` → (`expert_verified` | `source_verified` | `rejected`).

`expertReview.status`: `not_requested` → `requested` → (`approved` | `changes_requested` | `rejected`).

In the MVP, all content stays `draft`/`pending_expert_review`. Nothing is promoted to `expert_verified` until the steps below are complete.

## Workflow

1. **Author** content as `draft` with `expertReview.required: true`, `status: not_requested`.
2. **Self-check:** run the `content-quality-gate` skill (`npm run content:lint` + reviewer subagents). Fix all errors.
3. **Request review:** set `expertReview.status: requested`; mark item `pending_expert_review`. Prepare a review packet: the `scenarioText`, choices, `redFlags`, `legitimateWorkarounds`, `acceptanceChecks`, and the cited sources.
4. **Expert reviews** for factual accuracy, safety, and jurisdiction correctness (Madrid first).
5. **Record the outcome** in the item's `expertReview` block:
   - `approved` → set `reviewerName`, `reviewedAt` (ISO date), optional `notes`; item `status` may become `expert_verified` (or `source_verified` if backed by a verifiable primary source).
   - `changes_requested` → keep `pending_expert_review`, record `notes`, revise, resubmit.
   - `rejected` → set item `status: rejected`; do not ship it.
6. **Gate enforcement:** `scripts/content-lint.ts` fails the build if any item is `expert_verified` without `expertReview.status === 'approved'`, `reviewerName`, and `reviewedAt`.

## Who can approve

Only a named human expert. AI subagents (`domain-content-reviewer`, `safety-reviewer`) **assist** the review but can never grant `expert_verified` status.

## Source register

Every claim must trace to an entry in `src/content/sources/source-register.json`. Placeholder sources (`reliability: "placeholder"`) cannot support a verified claim — they only mark where a real source is still needed. See `docs/source-register.md`.
