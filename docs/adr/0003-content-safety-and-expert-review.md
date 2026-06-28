# ADR 0003 — Content safety and expert review

- Status: Accepted
- Date: 2026-06-28

## Context

The game teaches people making expensive, sometimes safety-critical decisions. Wrong or unsafe content is the biggest risk. Content will eventually be validated by a human expert.

## Decision

- Every content item carries `status`, `riskLevel`, `sourceIds`, and an `expertReview` block. Until a human expert validates it, content stays `draft`/`pending_expert_review`.
- A machine gate (`scripts/content-lint.ts`, `npm run content:lint`) enforces: source integrity, `safetyNotice` on high/critical items, workaround framing (`constraints`/`risks`/`rejectWhen`), no `expert_verified` without metadata, and a forbidden dangerous-DIY pattern scan.
- A documented human workflow (`docs/expert-review-workflow.md`) governs promotion to verified. AI reviewer subagents assist but can never grant verified status.
- The full content red lines live in `docs/safety-policy.md`.

## Consequences

- No claim ships as fact without a real source and (for technical content) expert sign-off.
- Authors get fast, deterministic feedback; reviewers get a clear packet and audit trail.
- Placeholder sources make "what still needs verification" explicit.
