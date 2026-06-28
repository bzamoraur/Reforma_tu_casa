---
name: content-quality-gate
description: Run before adding or marking any renovation content as publishable. Validates content schema, source integrity, safety notices, workaround framing, expert-review status, and dangerous-DIY patterns, then returns a pass/fail table.
---

# Content quality gate

Use this before adding new content or changing a content item's `status`.

## Inputs

- Changed content files (`src/content/levels/*.json`, cards).
- The source register (`src/content/sources/source-register.json`).
- Expert-review metadata embedded in each item.

## Procedure

1. Run `npm run content:lint` (schema + integrity + safety rules in `scripts/content-lint.ts`).
2. Confirm every `sourceId` exists in the register and is not a `placeholder` for any item claiming verification.
3. Confirm high/critical-risk items have a `safetyNotice`.
4. Confirm no dangerous-DIY instructions (the forbidden-pattern scan must be clean).
5. Confirm every workaround has `constraints`, `risks`, and `rejectWhen`.
6. Confirm no item is `expert_verified`/`source_verified` without complete metadata.
7. Optionally run the `domain-content-reviewer` and `safety-reviewer` subagents for judgement beyond mechanical checks.

## Output

A table of issues grouped by file: `severity | location | message | required fix`, ending in PASS or FAIL. FAIL if `npm run content:lint` exits non-zero or a reviewer returns "reject".
