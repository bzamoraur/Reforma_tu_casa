---
name: higgsfield-spike-review
description: Use before using Higgsfield for any asset/concept generation. Enforces explicit approval, a single goal, a credit cap, recorded prompts/settings, licensing checks, and a Go/No-Go note.
---

# Higgsfield spike review

Higgsfield is an **auxiliary** tool only (see `docs/adr/0005-higgsfield-as-auxiliary-tool-only.md`). Never use it for legal, safety, construction, or normative truth.

## Procedure

1. Confirm **explicit user approval** for this specific spike. If absent, stop.
2. Define exactly **one** asset or concept goal.
3. Define a **maximum credit spend** for the spike.
4. Record the prompt and settings used.
5. Save outputs **only if** licensing and provenance are acceptable and documented.
6. Decide whether the result should enter the game (it must be editable, versionable, and testable to qualify).
7. Log the run in `docs/mcp-usage-log.md`.

## Output

A Go/No-Go note appended to `docs/higgsfield-spike-plan.md` covering: goal, prompt, cost, licensing, provenance, result, and decision. Default to **No-Go** if any criterion is unmet.
