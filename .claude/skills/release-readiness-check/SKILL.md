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
2. Confirm disclaimers are present (house + module/transform screens + README + `index.html`).
3. Confirm no secrets and no real `.env`.
4. Confirm **all content** — level items AND each room module's `decide` item — is at least `draft`/`pending_expert_review` and **nothing** is `expert_verified` without metadata. A transformed room is **game state**, never `expert_verified`.
5. Confirm every high/critical-risk item has a `safetyNotice`, and risky modules attribute their transform to a professional.
6. **Asset provenance:** every shipped visual has an entry in `src/content/assets/assets-register.json`; any AI-generated art (Seedream/Higgsfield) has its **commercial-use + output-ownership terms confirmed** (no `license: "PENDING"` on shipped assets); `docs/CREDITS.md` is consistent. AI-art with unconfirmed terms is a release blocker (ADR-0006).

## Output

A release-readiness report: each check with PASS/FAIL/SKIPPED, blocking issues first, then release notes. Do not recommend release if any required gate fails or any high-risk content is unreviewed.
