---
name: release-readiness-check
description: Run before any demo or deploy. Runs the full quality gate, checks disclaimers, secrets, content-status floor, and high-risk safety notices, then produces a release-readiness report.
---

# Release readiness check

Use before a demo or deploy.

## Procedure

1. Run, in order, and capture results:
   - `npm run format:check`
   - `npm run lint`
   - `npm run typecheck`
   - `npm run test`
   - `npm run content:lint`
   - `npm run build`
   - `npm audit --audit-level=high`
   - `bash scripts/check-secrets.sh`
   - `npm run test:e2e` (only if Playwright browsers are installed; otherwise note it as skipped).
2. Confirm disclaimers are present (menu + scorecard + README + `index.html`).
3. Confirm no secrets and no real `.env`.
4. Confirm **all MVP content** is at least `pending_expert_review` (or `draft`) and **nothing** is `expert_verified` without metadata.
5. Confirm every high/critical-risk item has a `safetyNotice`.

## Output

A release-readiness report: each check with PASS/FAIL/SKIPPED, blocking issues first, then release notes. Do not recommend release if any required gate fails or any high-risk content is unreviewed.
