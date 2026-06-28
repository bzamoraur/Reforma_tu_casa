# ADR 0005 — Higgsfield as an auxiliary tool only

- Status: Accepted
- Date: 2026-06-28

## Context

Higgsfield can help with visual exploration (concept art, asset ideas, short videos). It must not become a core dependency or a source of truth, and external generation tools must not run without explicit approval.

## Decision

Higgsfield is **auxiliary only**. It may be used for visual ideation **after explicit user approval** and only through the `higgsfield-spike-review` skill, which enforces a single goal, a credit cap, recorded prompt/settings, licensing/provenance checks, and a Go/No-Go decision (`docs/higgsfield-spike-plan.md`). Higgsfield is **never** used for legal, safety, construction, or normative truth. No MCP server or generation tool is connected automatically; every use is logged in `docs/mcp-usage-log.md`.

## Consequences

- Placeholders remain the default art; gameplay never depends on generated assets.
- Any generated asset must be editable, versionable, testable, clearly licensed, and reproducible to enter the game; otherwise it is discarded.
- The project can always continue without Higgsfield.
